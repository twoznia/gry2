# gry2

Zbiór prostych gier przeglądarkowych stworzonych przez Tomka ([@twoznia](https://github.com/twoznia)).

> **Logowanie i zapis wyników:** gry2 dokłada warstwę logowania (e-mail + hasło,
> Supabase) wzorowaną na `first_app`. Zalogowani gracze zapisują rekordy w chmurze,
> goście grają bez zapisu. Szczegóły: [docs/logowanie.md](./docs/logowanie.md).

## Zawartość

- **[Pytania](./pytania/)** 🧠 – Quiz wiedzy ogólnej – historia, nauka, kultura i wiele więcej.
- **[Pytanka](./pytanka/)** 💡 – Quiz dla dzieci z 3 odpowiedziami do wyboru.
- **[Kulki](./kulki/)** 🔵 – Układaj linie kolorowych kulek w stylu klasycznego Color Lines.
- **[Soltaire](./soltaire/)** ♥️ – Klasyczny pasjans w stylu Piatnik.
- **[Wyścigi Aut](./auta/)** 🏎️ – Szybka jazda i omijanie przeszkód.
- **[River Raid](./riverraid/)** ✈️ – Arcadowy lot bojowy nad rzeką z paliwem, mostami i wrogami.
- **[Mat-Jaja](./mat-jaja/)** 🥚 – Matematyczna zabawa z jajkami w roli głównej.
- **[Rybak](./rybak/)** 🚣‍♂️ – Spokojny połów na pełnym jeziorze.
- **[Pisanie](./pisanie/)** 🖊️ – Naucz się pisać polskie słowa, literka po literce.
- **[Słówka](./słówka/)** 🇬🇧 – Trener słówek z nauką polski ↔ angielski.
- **[Kraje](./kraje/)** 🌍 – Sprawdź swoją wiedzę o krajach, stolicach i flagach!
- **[Memo](./memo/)** 🃏 – Znajdź wszystkie pary ukrytych obrazków!
- **[Puzzle](./puzzle/)** 🧩 – Składaj obrazki z puzzli, kawałek po kawałku.
- **[Tetris](./tetris/)** 🟦 – Klasyczny Tetris z neonową grafiką, systemem hold i podglądem następnych klocków.
- **[Kółko i Krzyżyk](./tictactoe/)** ⭕ – Klasyczna gra kółko i krzyżyk z AI na trzech poziomach trudności i różnych rozmiarach planszy.
- **[Tower Defense](./obrona/)** 🏰 – Broń swojej bazy przed falami wrogów – stawiaj wieże i przetrwaj jak najdłużej!
- **[Immuno](./imuno/)** 🦠 – Tower defense w roli układu odpornościowego: broń kolejnych narządów przed patogenami, ulepszaj komórki, graj na nieograniczonej liczbie poziomów.
- **[Anatom](./anatomia/)** 🫀 – Nauka anatomii człowieka: wskazuj i nazywaj struktury ciała na sylwetce, 4 poziomy trudności (od przedszkolaka po studenta fizjoterapii) i dwa tryby gry.
- **[Ptak](./ptak/)** 🐦 – Leć i omijaj przeszkody – klasyczna zabawa w stylu Flappy Bird!
- **[Saper](./saper/)** 💣 – Odkryj wszystkie pola nie trafiając na minę – klasyczny Saper.
- **[Skoczek](./jumper/)** 🦘 – Skacz po platformach i zbieraj punkty – neonowy platformer!
- **[Neonowy Wąż](./snake/)** 🐍 – Klasyczny Snake w neonowym stylu – rośnij i unikaj zderzeń.
- **[Mahjong](./mahjong/)** 🀄 – Mahjong Solitaire w średniowiecznym stylu z rankingiem i podpowiedziami.
- **[Sudoku](./sudoku/)** 🔢 – Klasyczne sudoku – wypełnij siatkę cyframi bez powtórzeń w wierszach, kolumnach i kwadratach.
- **[Koloruję Zwierzątka](./koloruj/)** 🎨 – Pokoloruj zwierzątko — kotka, pieska lub papugę. Po pomalowaniu ożywa i wraca na miejsce!
- **[Piramidy](./piramidy/)** 🔺 – Ustaw wysokości piramid tak, by liczba widocznych zgadzała się z podpowiedziami na brzegach planszy.
- **[Binairo](./binairo/)** ☀️🌙 – Wypełnij planszę słońcami i księżycami — po równo w każdym wierszu i kolumnie, nigdy trzy takie same obok siebie.
- **[Calcudoku](./calcudoku/)** 🧮 – Wypełnij siatkę liczbami 1–n bez powtórzeń w wierszach i kolumnach tak, by każda klatka dawała swój wynik.
- **[Nonogram](./nonogram/)** 🖼️ – Zamaluj pola tak, by ciągi zamalowanych pól w każdym wierszu i kolumnie zgadzały się z liczbami na brzegach.

---

## Słówka

Gra `Słówka` korzysta z manifestu `słówka/data/manifest.json`, który opisuje dostępne kategorie i zestawy CSV.

- źródłem danych pozostają katalogi i pliki CSV w `słówka/data/`,
- manifest jest plikiem pochodnym używanym przez grę,
- manifest aktualizuje skrypt `słówka/tools/generate_manifest.mjs`,
- przy zmianach w danych `Słówka` manifest odświeża workflow `.github/workflows/update-slowka-manifest.yml`.

---



## Dodawanie pytań do quizu

Pytania są przechowywane w pliku CSV:

```
pytania/dane/pytania.csv
```

Format wiersza: `category;subcategory;level;question;correct;wrong1;wrong2;wrong3`

Dostępne poziomy trudności: `łatwe`, `średnie`, `trudne`, `bardzo trudne`.

---

## Dodawanie nowej gry

1. Utwórz folder o nazwie gry (np. `moja-gra/`) z plikiem `index.html`.
2. Dodaj link powrotny do menu głównego: `<a href="../">← Menu</a>`.
3. W pliku `index.html` (główny) dodaj kartę gry do sekcji `<main class="game-container">`.
4. Zaktualizuj listę gier w tym `README.md`.

Gry używające ciemnego motywu (@twoznia design system) mogą dołączyć wspólny arkusz stylów:

```html
<link rel="stylesheet" href="../shared/style.css">
```
