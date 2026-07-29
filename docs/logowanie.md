# Logowanie i zapis wyników (Supabase)

gry2 = cała zawartość repo `gry` + warstwa logowania wzorowana na `first_app`.
Wyniki zapisują się w chmurze **tylko dla zalogowanych**. Gość gra bez zapisu rekordów.

## Jak to działa

- Każda strona (`index.html` gry oraz menu główne) dołącza jeden skrypt:
  `<script src="…/shared/auth.js"></script>` (ścieżka względna do głębokości folderu).
- `shared/auth.js` jest samowystarczalny: sam doładowuje `supabase-js` z CDN,
  wstrzykuje widget logowania (prawy górny róg) i modal (logowanie / rejestracja /
  reset hasła / „Graj jako gość"), oraz udostępnia globalne API.
- Logowanie: **e-mail + hasło** (rejestracja, logowanie, reset). Klucz publiczny
  Supabase jest wpisany w `shared/auth.js` (bezpieczny po stronie klienta; dostęp
  chroni RLS).

## Projekt Supabase

- Projekt: `gry2` (ref `bvsbiwivavcnwazctdfh`), region eu-central-1.
- Dedykowany **schemat `gry2`**, tabela `gry2.scores` z RLS: odczyt dla zalogowanych
  (globalne rekordy), zapis/edycja/usuwanie tylko własnych wierszy.
- Klient supabase-js łączy się domyślnie ze schematem `gry2`
  (`createClient(url, key, { db: { schema: 'gry2' } })`). Schemat jest wystawiony
  w API (Exposed schemas: `public, graphql_public, gry2`).
- Kolumny: `user_id, display_name, game, subgame, mode, level, score, time_seconds,
  errors, wave, lower_is_better, meta, created_at`. Reflex zapisuje `game='reflex'`,
  `subgame=<wariant>` (np. `znikanie`), `level='total'`.
- Schemat wersjonowany: `supabase/migrations/20260727180000_scores_core.sql`.

## API dla gier

```js
// Zapis wyniku (zalogowany -> Supabase, gość -> null):
GryScores.submit('snake', score, { lowerIsBetter: false });
GryScores.submit('soltaire', czasSekundy, { lowerIsBetter: true, mode: 'łatwy' });

// Najlepszy wynik gracza / globalna tabela rekordów:
await GryScores.best('snake');
await GryScores.leaderboard('snake', { limit: 10 });

// Sesja:
GryAuth.isLoggedIn(); GryAuth.user(); GryAuth.onChange(cb); GryAuth.openLogin();
```

## Automatyczny most localStorage → chmura

Aby nie zmieniać kodu każdej gry, `auth.js` obserwuje zapisy rekordów w
`localStorage` i lustrzanie wysyła je do Supabase (gdy zalogowany). Obsłużone
automatycznie (rejestr `WATCH` w `auth.js`):

| Gra | klucz localStorage | kierunek |
|-----|--------------------|----------|
| snake | `snake_high_score` | wyższy lepszy |
| riverraid | `riverRaidHighScore` | wyższy |
| obrona | `obronaHighScore`, `obronaHighWave` | wyższy |
| rybak | `rybak_hi` | wyższy |
| imuno | `imuno_hi_level` | wyższy |
| jumper | `neonJumperHighscore` | wyższy |
| ptak | `ptak_highscore` | wyższy |
| soltaire | `solitaire_piatnik_best` | niższy (czas) |
| memo | `memo-rec-*` | niższy (czas) |

## Reflex (leaderboard z imieniem) — pełna chmura

Wszystkie 11 wariantów reflex czyta i zapisuje rekordy **wyłącznie z Supabase**
(bez localStorage), bez zmian w kodzie gier. `auth.js` podmienia globalne funkcje gry:
- `loadRecords()` → dane z `gry2.scores` (odczyt z chmury),
- `saveRecordsToStorage()` → no-op (koniec zapisu lokalnego),
- `addRecord()` → wysyła rekord zalogowanego (per poziom + total) do chmury.
- Ekran końcowy: imię auto-uzupełnia się nazwą gracza i zapis jest automatyczny.
- Tabela rekordów odświeża się z chmury przy każdym otwarciu.
- Warianty na czas (`kolory, kolory2, liczby, litery`) używają `lower_is_better`.
- Gość: brak dostępu do rekordów w chmurze (RLS) — tabela pusta.

## Gry z rekordem liczbowym — odczyt i zapis z chmury

Dla gier z `WATCH` (snake, riverraid, obrona, rybak, imuno, jumper, ptak, soltaire):
`auth.js` przy zalogowaniu zaciąga najlepszy wynik z chmury do localStorage
(`syncNumericFromCloud`), więc wyświetlany rekord pochodzi z Supabase (na bieżącej
stronie po odświeżeniu, potem na żywo). Zapis nowych rekordów leci do chmury na bieżąco.

## Do zrobienia (wciąż lokalnie)

- **memo** — odczyt z chmury pominięty (dynamiczne klucze `memo-rec-*`); zapis działa.
- **binairo, calcudoku, nonogram, piramidy, sudoku** — rekordy czasowe per-poziom.
  Część gier jest owinięta w IIFE, więc nie da się ich podmienić z zewnątrz — wymagają
  edycji kodu gry: `GryScores.submit('<gra>', czas, { level, lowerIsBetter: true })`
  przy zapisie i odczytu z `GryScores.leaderboard(...)` przy renderze tabeli.
