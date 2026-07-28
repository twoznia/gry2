import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const manifestPath = path.join(dataDir, 'manifest.json');

function toPosixPath(...segments) {
  return segments.join('/').replace(/\\/g, '/');
}

function readCategories() {
  return readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    .map((categoryEntry) => {
      const categoryDir = path.join(dataDir, categoryEntry.name);
      const sets = readdirSync(categoryDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.csv'))
        .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
        .map((fileEntry) => ({
          name: fileEntry.name.replace(/\.csv$/i, ''),
          fileName: fileEntry.name,
          path: toPosixPath('data', categoryEntry.name, fileEntry.name),
        }));

      return {
        name: categoryEntry.name,
        path: toPosixPath('data', categoryEntry.name),
        sets,
      };
    });
}

function main() {
  if (!statSync(dataDir).isDirectory()) {
    throw new Error(`Data directory not found: ${dataDir}`);
  }

  const manifest = {
    categories: readCategories(),
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(`Manifest written to ${manifestPath}`);
}

main();
