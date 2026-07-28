# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Collection of simple browser games by [@twoznia](https://github.com/twoznia). Pure HTML/CSS/JS — no frameworks, no bundler, no backend. Each game runs directly in a browser and lives in its own top-level folder.

## Architecture

```
/
├── index.html          # Main menu — lists all game cards
├── shared/style.css    # Shared dark-theme design system
├── <game-folder>/
│   ├── index.html      # Required
│   ├── style.css       # Optional
│   └── script.js       # Optional
├── pytania/            # Adult quiz — data in pytania/dane/pytania.csv
├── pytanka/            # Kids quiz — data in pytanka/dane/pytania.csv
└── słówka/             # Vocabulary trainer — data in słówka/data/, manifest in słówka/data/manifest.json
```

Games are fully self-contained — they do not depend on each other. Shared code lives only in `shared/`.

## Logowanie / zapis wyników (gry2)

Wspólna warstwa auth + zapis wyników w Supabase (self-contained `shared/auth.js`,
dołączany jednym `<script>` na każdej stronie). Zalogowany zapisuje rekordy w
chmurze, gość gra bez zapisu. API: `GryScores.submit/best/leaderboard`, `GryAuth`.
Mostek `localStorage → Supabase` (rejestr `WATCH` w `auth.js`) synchronizuje proste
rekordy liczbowe bez zmian w kodzie gier. Pełny opis: `docs/logowanie.md`.

## Zasady pracy (oszczędność tokenów)

Te reguły mają trzymać sesje krótkie i tanie:

- **Nowa gałąź od `main` na każde zadanie** — nie kontynuuj na starych, przeterminowanych gałęziach (ryzyko destrukcyjnych PR-ów). Po scaleniu zaczynaj od świeżej gałęzi.
- **Grupuj zmiany w jeden PR** — rób kilka powiązanych zmian naraz, dopiero potem PR + merge. Unikaj wielu małych cykli PR→merge→rebase.
- **NIE wczytuj plików CSV** (`pytania/dane/pytania.csv`, `pytanka/dane/pytania.csv`, `słówka/data/**`) dopóki użytkownik nie poprosi o to wyraźnie — są duże. Do podglądu używaj `Grep`/`head`/`offset`, nie czytaj całości.
- **Czytaj pliki fragmentami** (`offset`/`limit`, `Grep`), nie w całości — zwłaszcza duże skrypty i dane.
- **Nie ładuj ciężkich skilli bez potrzeby** (np. dokumentacji API) — przy prostych zmianach edytuj kod wprost.
- **Oszczędnie z GitHub MCP** — odpowiedzi są bardzo duże. Do inspekcji używaj lokalnego `git`/`git log`; MCP rezerwuj do tworzenia i merge'owania PR-ów. Status CI sprawdzaj raz, nie w pętli.
- **Odpowiadaj krótko** — zwięzłe odpowiedzi i podsumowania, bez długich opisów. Sam efekt + ew. jedno zdanie kontekstu.
- **Domyślnie NIE uruchamiaj testów ani weryfikacji** — zwłaszcza drogich (przeglądarka, screenshoty, wizualizacje, skille `verify`/`run`). Do walidacji wystarczy tania kontrola składni (`node --check`). Testy uruchamiaj **tylko** gdy w prompcie pojawi się słowo `test`.
- **`/loop` ogranicz do max 3 iteracji w jednej sesji.** Przy zadaniach generujących dużo treści (np. paczki pytań) kontekst rośnie z każdą iteracją, bo cała dotychczasowa historia sesji jest doliczana do kolejnego promptu. Po 3 przebiegach zatrzymaj pętlę i zacznij nową sesję/gałąź zamiast kontynuować w tej samej. Ciężkie generowanie deleguj do subagentów (Agent tool), nie rób go bezpośrednio w głównej rozmowie.

## Coding rules

- `const`/`let` only, never `var`
- Comments in Polish or English — match the existing file's style
- New games must include: `<a class="back-link" href="../">← Wróć</a>` directly inside `<body>`
- New games may use the shared design system: `<link rel="stylesheet" href="../shared/style.css">`
- Nowe gry twórz od razu z osobnym `style.css` i `script.js` — bez inline `<style>`/`<script>` w `index.html`

## Design system (`shared/style.css`)

Key CSS variables: `--bg` (#0f172a), `--card` (#1e293b), `--border` (#334155), `--text` (#f8fafc), `--muted` (#94a3b8), `--accent` (#38bdf8), `--green` (#22c55e), `--red` (#ef4444), `--yellow` (#f59e0b).

Ready-made classes: `.screen`/`.screen.active`, `.card`, `.btn.btn-primary`, `.btn.btn-secondary`, `.hud`, `.progress-bar`, `.progress-dot`, `a.back-link`.

## Data-driven games

### Pytania (`pytania/dane/pytania.csv`)
Format (no header, semicolon separator, UTF-8):
```
category;subcategory;level;question;correct;wrong1;wrong2;wrong3
```
Levels: `łatwe` · `średnie` · `trudne` · `bardzo trudne`

### Pytanka (`pytanka/dane/pytania.csv`)
Same format but only 3 wrong answers (`wrong1;wrong2`, no `wrong3`).

### Słówka (`słówka/data/`)
- CSV files in `słówka/data/<Category>/<set>.csv`, format: `polskie słowo,angielskie słowo` (comma separator, no header)
- `słówka/data/manifest.json` is auto-generated — **never edit it manually**
- Regenerate after data changes: `node słówka/tools/generate_manifest.mjs` (Node.js 18+)
- Also updated automatically by GitHub Actions on push to `słówka/data/**`

## Node.js tools

```bash
# Regenerate słówka manifest
node słówka/tools/generate_manifest.mjs
```

## Adding a new game

1. Create `<game-folder>/index.html` (and optionally `style.css`, `script.js`)
2. Add `<a class="back-link" href="../">← Wróć</a>` inside `<body>`
3. Update `index.html`, `README.md`, and `status.md` in the repo root to include the new game
