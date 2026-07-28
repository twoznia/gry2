# Przegląd gier — propozycje poprawek

Stan na 2026-06-25. Przegląd objął wszystkie top-level gry oraz podgry `reflex/*`.

Każda pozycja ma **ID** (F1, F2, …), żeby można było wskazać skillowi `apply-review-fixes`,
które poprawki zaimplementować. Status: `[ ]` do zrobienia · `[x]` zrobione.

Legenda nakładu: **S** = mały, **M** = średni, **L** = duży.

> **Wdrożono dotąd:** F4, F6, F7 (bezpieczne, bez pobierania plików).
> **Świadomie odłożone** (wymagają osobnej decyzji): F1 — bez kroku build/JIT
> usunięcie Tailwind CDN zepsułoby klasy z wartościami w nawiasach (`min-h-[3rem]`);
> F2/F3 — wymagają pobrania plików (czcionki/flagi) do repo; F5/F8 — duże refaktory
> zmieniające wygląd. Uruchom skill `apply-review-fixes`, żeby zdecydować o nich.

---

## Poprawki obejmujące wiele gier (systemowe)

### [ ] F1 — Tailwind z CDN w produkcji  · nakład: L
`https://cdn.tailwindcss.com` to narzędzie deweloperskie (wypisuje ostrzeżenie w
konsoli, powoduje „mignięcie" niestylowanej treści przy starcie i pobiera duży
skrypt przy każdym wejściu). Lepiej dołączyć mały, prebudowany plik CSS z
potrzebnymi klasami albo przejść na lokalny CSS / współdzielony design system.
**Pliki:** `jumper`, `kulki`, `mahjong`, `obrona`, `ptak`, `saper`, `snake`,
`soltaire`, `tictactoe`, `reflex/index.html` oraz wszystkie `reflex/<gra>/index.html`.

### [ ] F2 — Czcionki Google z sieci  · nakład: M
`fonts.googleapis.com` dokłada opóźnienie, nie działa offline i wysyła żądanie do
zewnętrznego serwera. Można self-hostować plik woff2 lub użyć systemowego font-stacku.
**Pliki:** `jumper`, `kulki`, `ptak`, `saper`, `snake`, `soltaire`, `sudoku`, `tictactoe`.

### [ ] F3 — Flagi z zewnętrznego CDN (flagcdn.com)  · nakład: M
Obrazki flag z `flagcdn.com` znikają offline, dokładają przesunięcie układu (brak
wymiarów rezerwowanych) i wysyłają żądania na zewnątrz. Warto trzymać kilka małych
PNG-ów lokalnie (np. `shared/flags/`).
**Pliki:** `auta`, `kraje`, `mat-jaja`, `memo`, `pisanie`, `rybak`, `słówka`.

### [x] F4 — `100vh` na mobile  · nakład: S
`100vh` na telefonach liczy się razem z paskiem adresu przeglądarki, przez co treść
bywa ucięta lub chowa się pod paskiem. Zamienić na `100dvh` (z `100vh` jako fallback).
**Pliki:** `shared/style.css` oraz m.in. `jumper`, `obrona`, `ptak`, `riverraid`,
`saper`, `soltaire`, `słówka`, `tetris`, `tictactoe`, `reflex/index.html` i podgry
`reflex/*`.

### [ ] F5 — Niewykorzystany wspólny design system  · nakład: L
`shared/style.css` (zmienne kolorów, `.card`, `.btn`, `.hud`, `a.back-link` itd.)
nie jest używany przez **żadną** grę — stąd niespójny wygląd i powielony CSS.
Opcjonalnie: stopniowo przepiąć gry na współdzielone tokeny dla spójności.

---

## Poprawki dla konkretnych gier / obszarów

### [x] F6 — Reflex: kompaktowy pasek HUD na mobile  · nakład: M
Po wejściu w grę tytuł jest już chowany, ale pasek statystyk (Etap / Pozostało /
Czas) używa dużej czcionki (`text-xl`) i zajmuje sporo miejsca na małych ekranach —
analogicznie do nagłówka Mahjonga, który już skompaktowaliśmy. Warto zmniejszyć
pasek HUD w podgrach `reflex/*`.

### [x] F7 — `mat-jaja`: powielone style inline przełącznika języka  · nakład: S
Przyciski PL/EN mają długie, identyczne style inline. Wyciągnąć do `style.css`
(klasa `.lang-btn`), żeby było czytelniej i spójnie z innymi grami z flagami.

### [ ] F8 — Spójny przełącznik języka  · nakład: M
Kilka gier ma własny przełącznik PL/EN (różne pozycje, style, mechanizmy):
`mat-jaja`, `memo`, `auta`, `rybak`, `pisanie`, `kraje`, `słówka`, `reflex/litery`.
Warto ujednolicić do jednego komponentu (pozycja, wygląd, sposób zapamiętywania wyboru).

---

## Do pogłębionego przeglądu (gameplay / UX — wymaga wejścia w grę)

Skan kodu nie wykrył twardych błędów (wszystkie gry mają back-link, viewport,
`lang`, brak `var`, brak `console.log`). Poniższe gry warto przejść ręcznie pod
kątem rozgrywki — każdą można zlecić skillowi jako „pogłębiony przegląd gry X":

`auta`, `jumper`, `koloruj`, `kraje`, `kulki`, `mahjong`, `memo`, `obrona`,
`pisanie`, `ptak`, `puzzle`, `pytania`, `pytanka`, `riverraid`, `rybak`, `saper`,
`snake`, `soltaire`, `sudoku`, `słówka`, `tetris`, `tictactoe`, oraz `reflex/*`.

---

## Jak zaimplementować

Uruchom skill **`apply-review-fixes`** — pokaże tę listę, pozwoli wybrać poprawki
(np. „F1 i F4") i zaimplementuje wybrane w odpowiednich plikach. Po wdrożeniu
zaznaczy je tutaj jako `[x]`.
