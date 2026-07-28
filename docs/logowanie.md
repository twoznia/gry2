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

## Reflex (leaderboard z imieniem) — obsłużone automatycznie

Wszystkie 11 wariantów reflex jest zintegrowanych bez zmian w ich kodzie:
- **Auto-uzupełnienie imienia**: na ekranie końcowym pole imienia dostaje nazwę
  zalogowanego gracza, a przycisk „Zapisz" jest klikany automatycznie.
- **Chmura**: `auth.js` obserwuje zapis `reflex…Records`, wyławia wynik `total`
  zalogowanego gracza i wysyła jako `game='reflex', subgame=<wariant>, level='total'`.
- Gość gra jak dotąd — ręczne wpisanie imienia, tylko zapis lokalny.

## Do rozszerzenia (na razie tylko zapis lokalny)

- **binairo, calcudoku, nonogram, piramidy, sudoku** — `RECORDS_KEY` = rekordy
  czasowe per-poziom (obiekty). Aby zsynchronizować, wstaw w miejscu zapisu rekordu
  `GryScores.submit('<gra>', czas, { level: poziom, lowerIsBetter: true })`.
