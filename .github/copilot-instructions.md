# Copilot Instructions – twoznia/gry

## Opis projektu

Zbiór prostych gier przeglądarkowych napisanych w czystym HTML/CSS/JavaScript (bez frameworków, bez bundlera, bez backendu). Każda gra działa bezpośrednio w przeglądarce. Projekt tworzony jest przez [@twoznia](https://github.com/twoznia).

---

## Struktura repozytorium

```
/
├── index.html          # Strona główna – menu wszystkich gier
├── style.css           # Style strony głównej
├── script.js           # Skrypt strony głównej
├── shared/
│   ├── style.css       # Wspólny design system (ciemny motyw)
│   └── icons/          # Wspólne ikony SVG
├── <nazwa-gry>/
│   ├── index.html      # Gra (wymagany)
│   ├── style.css       # Style gry (opcjonalny)
│   └── script.js       # Logika gry (opcjonalny)
├── pytania/            # Quiz wiedzy ogólnej
│   ├── dane/
│   │   └── pytania.csv # Baza pytań (format CSV)
│   └── tools/          # Skrypty Node.js do zarządzania pytaniami
├── pytanka/            # Quiz dla dzieci
│   ├── dane/
│   │   └── pytania.csv # Baza pytań dla dzieci (format CSV)
│   └── tools/
├── słówka/             # Trener słówek PL↔EN
│   ├── data/           # Zestawy CSV + manifest.json
│   └── tools/
│       └── generate_manifest.mjs  # Skrypt odświeżający manifest
└── .github/
    ├── workflows/
    │   └── update-slowka-manifest.yml  # Auto-update manifest słówek
    └── ISSUE_TEMPLATE/
```

---

## Istniejące gry

| Folder | Nazwa | Opis |
|--------|-------|------|
| `auta/` | Wyścigi Aut 🏎️ | Omijaj przeszkody, jedź jak najszybciej |
| `riverraid/` | River Raid ✈️ | Arcade – lot bojowy nad rzeką |
| `mat-jaja/` | Mat-Jaja 🥚 | Matematyczna zabawa z jajkami |
| `rybak/` | Rybak 🚣 | Spokojna gra wędkarska |
| `pisanie/` | Pisanie 🖊️ | Nauka pisania polskich słów, literka po literce |
| `słówka/` | Słówka 🇬🇧 | Trener słówek PL↔EN z zestawami CSV |
| `kraje/` | Kraje 🌍 | Quiz – kraje, stolice, flagi |
| `memo/` | Memo 🃏 | Znajdź pary ukrytych obrazków |
| `puzzle/` | Puzzle 🧩 | Składaj obrazki z puzzli |
| `tetris/` | Tetris 🟦 | Klasyczny Tetris, neonowa grafika, SRS, hold, podgląd |
| `pytania/` | Pytania 🧠 | Quiz wiedzy ogólnej – historia, nauka, kultura |
| `pytanka/` | Pytanka 🐣 | Quiz dla dzieci, 3 odpowiedzi |
| `tictactoe/` | Kółko i Krzyżyk ⭕ | AI na 3 poziomach, różne rozmiary planszy |
| `obrona/` | Tower Defense 🏰 | Broń bazy przed falami wrogów |
| `ptak/` | Ptak 🐦 | Flappy Bird – leć i omijaj przeszkody |
| `saper/` | Saper 💣 | Klasyczny Saper – odkryj pola bez min |
| `jumper/` | Skoczek 🦘 | Neonowy platformer – skacz i zbieraj punkty |

---

## Dodawanie nowej gry

1. Utwórz folder `<nazwa-gry>/` z plikiem `index.html`.
2. Dodaj link powrotny do menu głównego wewnątrz gry:
   ```html
   <a href="../">← Menu</a>
   ```
3. W `index.html` (root) dodaj kartę gry do sekcji `<main class="game-container">`:
   ```html
   <a href="./<nazwa-gry>/" class="game-card">
       <span class="icon">🎮</span>
       <h2>Nazwa Gry</h2>
       <p style="color: #94a3b8; font-size: 0.9rem;">Krótki opis.</p>
       <div class="play-btn">Zagraj</div>
   </a>
   ```
4. Zaktualizuj sekcję `## Zawartość` w `README.md`.

---

## Design system (ciemny motyw)

Gry mogą korzystać ze wspólnego arkusza stylów `shared/style.css`:

```html
<link rel="stylesheet" href="../shared/style.css">
```

### Zmienne CSS

| Zmienna | Wartość | Przeznaczenie |
|---------|---------|---------------|
| `--bg` | `#0f172a` | Tło strony |
| `--card` | `#1e293b` | Tło kart |
| `--border` | `#334155` | Obramowania |
| `--text` | `#f8fafc` | Tekst główny |
| `--muted` | `#94a3b8` | Tekst pomocniczy |
| `--accent` | `#38bdf8` | Akcent (niebieski) |
| `--green` | `#22c55e` | Sukces |
| `--red` | `#ef4444` | Błąd |
| `--yellow` | `#f59e0b` | Ostrzeżenie |

### Gotowe klasy CSS

- `.screen` / `.screen.active` – ekrany gry (ukryte / widoczne)
- `.card` – karta z tłem i obramowaniem
- `.btn.btn-primary` – przycisk akcji (niebieski)
- `.btn.btn-secondary` – przycisk drugorzędny
- `.hud` – pasek informacji (wynik, czas)
- `.progress-bar` / `.progress-dot` – pasek postępu
- `.game-title`, `.game-subtitle` – typografia
- `a.back-link` – stały link powrotny (lewy górny róg)

---

## Dane – gry oparte na CSV

### Pytania (`pytania/dane/pytania.csv`)

Format wiersza:
```
category;subcategory;level;question;correct;wrong1;wrong2;wrong3
```

Dozwolone poziomy: `łatwe` · `średnie` · `trudne` · `bardzo trudne`

Przykład:
```
Film i Telewizja;Aktorzy;trudne;Kto zagrał Hana Solo?;Harrison Ford;Tom Hanks;Brad Pitt;Johnny Depp
```

### Pytanka (`pytanka/dane/pytania.csv`)

Format – 3 błędne odpowiedzi zamiast 4 (brak `wrong3`):
```
category;subcategory;level;question;correct;wrong1;wrong2
```

### Słówka (`słówka/data/`)

- Zestawy w plikach CSV wewnątrz podkatalogów `słówka/data/<kategoria>/`
- Format wiersza: `polskie słowo,angielskie słowo` (lub odwrotnie)
- `słówka/data/manifest.json` opisuje dostępne kategorie i pliki – generowany automatycznie przez `słówka/tools/generate_manifest.mjs`
- **Nie edytuj `manifest.json` ręcznie** – jest aktualizowany przez GitHub Actions po każdym push do `słówka/data/**`

---

## Narzędzia Node.js

### Odświeżanie manifestu słówek (`słówka/tools/generate_manifest.mjs`)

```bash
node słówka/tools/generate_manifest.mjs
```

Zwykle uruchamiany automatycznie przez GitHub Actions.

---

## GitHub Actions

### `update-slowka-manifest.yml`

- **Wyzwalacz:** push do `słówka/data/**` (z pominięciem `manifest.json`)
- **Działanie:** uruchamia `generate_manifest.mjs` i commituje zaktualizowany `manifest.json`
- **Bot:** `github-actions[bot]`

---

## Zasady kodowania

- **Brak frameworków, brak bundlera** – czyste HTML/CSS/JavaScript
- **Brak `node_modules` w repo** – narzędzia (`tools/`) używają wbudowanego `fetch` Node.js 18
- Każda gra jest **samodzielna** – nie zależy od innych gier
- CSS pisz w pliku gry lub korzystaj z `shared/style.css`
- Używaj `const`/`let`, bez `var`
- Komentarze po polsku lub angielsku – trzymaj się stylu istniejącego pliku
- Przy modyfikacji menu `index.html` zachowuj istniejącą kolejność kart i styl inline (`color: #94a3b8`)
