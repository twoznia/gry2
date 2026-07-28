// Programowa restrukturyzacja CSV quizów (pytania/pytanka) — zmiana nazw
// category/subcategory, scalanie subkategorii, deduplikacja — bez wczytywania
// treści pytań do kontekstu rozmowy.
//
// Użycie:
//   node pytania/tools/restructure_csv.mjs --target=pytania
//   node pytania/tools/restructure_csv.mjs --target=pytanka
//
// Mapowanie zmian zdefiniuj w MAPPING poniżej (lub zaimportuj z pliku JSON).

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";

// --- Mapowanie zmian ---------------------------------------------------
// Klucz: "StaraKategoria;StaraSubkategoria" -> wartość: [NowaKategoria, NowaSubkategoria]
// Jeśli chcesz zmienić tylko category lub tylko subcategory, i tak podaj obie
// wartości docelowe (przepisz niezmienioną, jeśli nie ma się zmieniać).
const MAPPING = {
  // "Historia;Stara Subkategoria": ["Historia", "Nowa Subkategoria"],
};

// -------------------------------------------------------------------------

const TARGETS = {
  pytania: { path: "pytania/dane/pytania.csv", fields: 8 },
  pytanka: { path: "pytanka/dane/pytania.csv", fields: 7 },
};

const LEVELS = new Set(["łatwe", "średnie", "trudne", "bardzo trudne"]);

function parseArgs() {
  const arg = process.argv.find((a) => a.startsWith("--target="));
  const target = arg ? arg.split("=")[1] : null;
  if (!target || !TARGETS[target]) {
    console.error("Użycie: node restructure_csv.mjs --target=pytania|pytanka");
    process.exit(1);
  }
  return target;
}

function main() {
  const target = parseArgs();
  const { path, fields: expectedFields } = TARGETS[target];

  if (!existsSync(path)) {
    console.error(`Nie znaleziono pliku: ${path}`);
    process.exit(1);
  }

  const raw = readFileSync(path, "utf-8");
  const lines = raw.split("\n").filter((l) => l.length > 0);
  const header = lines[0];
  const dataLines = lines.slice(1);

  const inputCount = dataLines.length;
  const changedPairs = new Set();
  const invalidRows = [];
  const seenPerBucket = new Map(); // "category;subcategory" -> Set(question)
  let duplicatesDropped = 0;
  const outputLines = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const cols = line.split(";");

    if (cols.length !== expectedFields) {
      invalidRows.push({ line: i + 2, reason: `oczekiwano ${expectedFields} pól, jest ${cols.length}` });
      continue;
    }

    let [category, subcategory, level, question, correct, ...wrongs] = cols;

    const mapKey = `${category};${subcategory}`;
    if (MAPPING[mapKey]) {
      const [newCategory, newSubcategory] = MAPPING[mapKey];
      if (newCategory !== category || newSubcategory !== subcategory) {
        changedPairs.add(mapKey);
      }
      category = newCategory;
      subcategory = newSubcategory;
    }

    const rebuilt = [category, subcategory, level, question, correct, ...wrongs];

    if (rebuilt.some((f) => f.trim() === "")) {
      invalidRows.push({ line: i + 2, reason: "puste pole po transformacji" });
      continue;
    }
    if (!LEVELS.has(level)) {
      invalidRows.push({ line: i + 2, reason: `nieprawidłowy level: ${level}` });
      continue;
    }

    const bucketKey = `${category};${subcategory}`;
    if (!seenPerBucket.has(bucketKey)) seenPerBucket.set(bucketKey, new Set());
    const bucket = seenPerBucket.get(bucketKey);
    if (bucket.has(question)) {
      duplicatesDropped++;
      continue;
    }
    bucket.add(question);

    outputLines.push(rebuilt.join(";"));
  }

  if (invalidRows.length > 0) {
    console.error(`Znaleziono ${invalidRows.length} nieprawidłowych wierszy po transformacji — plik NIE został nadpisany:`);
    for (const r of invalidRows.slice(0, 50)) {
      console.error(`  linia ${r.line}: ${r.reason}`);
    }
    if (invalidRows.length > 50) console.error(`  ... i ${invalidRows.length - 50} więcej`);
    process.exit(1);
  }

  const backupPath = `${path}.bak`;
  copyFileSync(path, backupPath);

  const finalContent = [header, ...outputLines].join("\n") + "\n";
  writeFileSync(path, finalContent, "utf-8");

  console.log(`Plik: ${path}`);
  console.log(`Kopia zapasowa: ${backupPath}`);
  console.log(`Wierszy wejściowych: ${inputCount}`);
  console.log(`Wierszy wyjściowych: ${outputLines.length}`);
  console.log(`Zmienionych par category;subcategory: ${changedPairs.size}`);
  console.log(`Odrzuconych duplikatów: ${duplicatesDropped}`);
  console.log(`Odrzuconych błędnych wierszy: ${invalidRows.length}`);
}

main();
