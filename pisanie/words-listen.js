/* ===========================================================================
   Słowa do modułu "Słuchanie" (pisanie bez obrazka)
   ---------------------------------------------------------------------------
   Słowa pogrupowane są według DŁUGOŚCI (3–8 liter).
   Aby dodać własne słowo: dopisz je do właściwej tablicy (wielkimi literami).
   W grze losowane są 3 słowa z każdej długości.
   Poziom trudności: dziecko 6–7 lat (proste, znane słowa).
   =========================================================================== */

const LISTEN_WORDS_PL = {
    3: [
        'KOT', 'LEW', 'KOŃ', 'MIŚ', 'JEŻ', 'SER', 'BUS', 'DOM', 'LÓD', 'GRA',
        'LIS', 'WĄŻ', 'GĘŚ', 'SOK', 'OKO', 'NOS', 'RAK', 'ŁOŚ', 'ŻUK', 'MOP',
        'SEN', 'NOC', 'TOR', 'WÓZ', 'KOC', 'MAK', 'LAS', 'DĄB', 'NIĆ', 'SAD',
        'RÓG', 'BÓB', 'MUR', 'DYM', 'OSA', 'KIJ', 'PAN', 'SYN', 'RYŻ', 'BAL',
    ],
    4: [
        'RYBA', 'ŻABA', 'KURA', 'PIES', 'KOZA', 'OWCA', 'KRAB', 'MYSZ', 'TORT', 'LODY',
        'ŁÓDŹ', 'WODA', 'AUTO', 'FOKA', 'SŁOŃ', 'ZUPA', 'MAPA', 'LAMA', 'MOST', 'OKNO',
        'NOGA', 'RĘKA', 'UCHO', 'SOWA', 'WILK', 'RÓŻA', 'BRAT', 'DACH', 'PŁOT', 'LIŚĆ',
        'GÓRA', 'POLE', 'ŁĄKA', 'STÓŁ', 'SZAL', 'KINO', 'BUTY', 'KASA', 'WAZA', 'RAMA',
    ],
    5: [
        'KOTEK', 'MAŁPA', 'ZEBRA', 'PANDA', 'LISEK', 'KROWA', 'KUCYK', 'PIŁKA', 'PIZZA', 'ZAMEK',
        'ZAJĄC', 'ROWER', 'GRZYB', 'TRAWA', 'KWIAT', 'ANIOŁ', 'KOGUT', 'KONIK', 'MISIO', 'ROBOT',
        'DOMEK', 'SARNA', 'OSIOŁ', 'WRONA', 'LAMPA', 'SZAFA', 'KRZAK', 'CHLEB', 'BUŁKA', 'MLEKO',
        'BANAN', 'MORZE', 'NIEBO', 'RAMKA', 'KOTKA', 'GŁOWA', 'STOPA', 'PALEC', 'WŁOSY', 'WIDŁY',
    ],
    6: [
        'TYGRYS', 'ŻYRAFA', 'MRÓWKA', 'KRÓLIK', 'POCIĄG', 'SŁONIK', 'ŚWINKA', 'BAŁWAN', 'KANGUR', 'WRÓBEL',
        'KACZKA', 'JABŁKO', 'STATEK', 'PAPUGA', 'CHOMIK', 'SYRENA', 'WIADRO', 'ŚLIMAK', 'NOŻYCE', 'OŁÓWEK',
        'BOCIAN', 'GĘSIOR', 'PIESEK', 'KWIATY', 'JAGODY', 'MALINA', 'BANANY', 'GRUSZA', 'CEBULA', 'OGÓREK',
        'SAŁATA', 'ZESZYT', 'KREDKA', 'PLECAK', 'MISIEK', 'KLOCEK', 'CZAPKA', 'SZALIK', 'BUCIKI', 'LAMPKA',
    ],
    7: [
        'PINGWIN', 'SŁONICA', 'PAPUŻKA', 'CHMURKA', 'CIĄGNIK', 'GWIAZDA', 'KSIĘŻYC', 'RAKIETA', 'TRAMWAJ', 'RENIFER',
        'SAMOLOT', 'PARASOL', 'TORNADO', 'TRÓJKĄT', 'BATERIA', 'LODÓWKA', 'TULIPAN', 'LAMPION', 'HERBATA', 'KOSMITA',
        'AUTOBUS', 'POMIDOR', 'MARCHEW', 'KAPUSTA', 'KANAPKA', 'ROWEREK', 'WALIZKA', 'PIANINO', 'BĘBENEK', 'REKINEK',
        'KOTLETY', 'PIEROGI', 'CIASTKO', 'MOTYLEK', 'ZEGAREK', 'TELEFON', 'ZWIERZĘ', 'ZIELONY', 'OBRAZEK', 'KOMÓRKA',
    ],
    8: [
        'KROKODYL', 'DINOZAUR', 'MOTOCYKL', 'WIELBŁĄD', 'LALECZKI', 'KRÓLEWNA', 'PSZCZOŁA', 'CUKIEREK', 'BAŁWANEK', 'RYCERZYK',
        'KAPELUSZ', 'GWIAZDKA', 'NARCIARZ', 'KASZTANY', 'PIEROŻEK', 'MIKROFON', 'PATELNIA', 'MUCHOMOR', 'WIELORYB', 'SZKIELET',
        'SAMOCHÓD', 'KOMPUTER', 'CUKIERKI', 'KOTECZEK', 'DELFINEK', 'SKORPION', 'JASKÓŁKA', 'BAŻANCIK', 'INDYCZEK', 'KURCZAKI',
        'ZAJĄCZEK', 'HUŚTAWKA', 'KARUZELA', 'PIASKOWY', 'KIEŁBASA', 'NALEŚNIK', 'PIERNIKI', 'ROGALIKI', 'ŁÓŻECZKO', 'OGRODNIK',
    ],
};

const LISTEN_WORDS_EN = {
    3: [
        'CAT', 'DOG', 'COW', 'PIG', 'HEN', 'EGG', 'BUS', 'CAR', 'SUN', 'ANT',
        'BEE', 'FOX', 'OWL', 'BAT', 'FLY', 'HAT', 'CUP', 'MAP', 'KEY', 'BOX',
        'PEN', 'BED', 'CAP', 'BAG', 'PIE', 'BUN', 'JAM', 'NUT', 'FAN', 'JAR',
        'MUG', 'POT', 'PAN', 'TOY', 'BUG', 'RAT', 'LEG', 'ARM', 'EAR', 'NET',
    ],
    4: [
        'BEAR', 'DUCK', 'FROG', 'GOAT', 'FISH', 'CRAB', 'LAMB', 'LION', 'WOLF', 'DEER',
        'SEAL', 'TREE', 'CAKE', 'MILK', 'STAR', 'BOOK', 'SHIP', 'DOOR', 'BIRD', 'ROSE',
        'BALL', 'KITE', 'DRUM', 'BELL', 'RING', 'SOCK', 'SHOE', 'COAT', 'HAND', 'FOOT',
        'NOSE', 'FACE', 'HAIR', 'CORN', 'PEAR', 'PLUM', 'LEAF', 'MOON', 'BOAT', 'SNOW',
    ],
    5: [
        'HORSE', 'SNAKE', 'TIGER', 'PANDA', 'ZEBRA', 'KOALA', 'SHARK', 'WHALE', 'EAGLE', 'MOUSE',
        'GOOSE', 'DAISY', 'PIZZA', 'APPLE', 'GRAPE', 'LEMON', 'TRAIN', 'CLOCK', 'ROBOT', 'PIANO',
        'SHEEP', 'PUPPY', 'BUNNY', 'CHICK', 'CAMEL', 'MOOSE', 'SNAIL', 'ROBIN', 'BREAD', 'JUICE',
        'HONEY', 'CANDY', 'MANGO', 'MELON', 'BERRY', 'TOAST', 'PLATE', 'SPOON', 'CHAIR', 'HOUSE',
    ],
    6: [
        'PARROT', 'RABBIT', 'MONKEY', 'TURTLE', 'SPIDER', 'CASTLE', 'BRIDGE', 'ROCKET', 'PENCIL', 'FLOWER',
        'CHERRY', 'COOKIE', 'DRAGON', 'GUITAR', 'DONKEY', 'MIRROR', 'CARROT', 'WINDOW', 'BUCKET', 'PIGEON',
        'KITTEN', 'PUFFIN', 'BEAVER', 'BADGER', 'WALRUS', 'TURKEY', 'BANANA', 'ORANGE', 'POTATO', 'TOMATO',
        'CHEESE', 'BUTTER', 'PEPPER', 'PICKLE', 'MUFFIN', 'DONUTS', 'JACKET', 'JUMPER', 'BASKET', 'PILLOW',
    ],
    7: [
        'PENGUIN', 'DOLPHIN', 'GIRAFFE', 'LEOPARD', 'CHICKEN', 'LOBSTER', 'HAMSTER', 'OCTOPUS', 'PEACOCK', 'RAINBOW',
        'BALLOON', 'LANTERN', 'BICYCLE', 'TRUMPET', 'DIAMOND', 'PUMPKIN', 'MERMAID', 'COMPASS', 'PRESENT', 'SAUSAGE',
        'ROOSTER', 'GORILLA', 'CHEETAH', 'BUFFALO', 'TADPOLE', 'SPARROW', 'OSTRICH', 'SEAGULL', 'CABBAGE', 'CARROTS',
        'POPCORN', 'PRETZEL', 'COOKIES', 'CUPCAKE', 'PANCAKE', 'SANDALS', 'BLANKET', 'CURTAIN', 'PICTURE', 'TURTLES',
    ],
    8: [
        'DINOSAUR', 'HEDGEHOG', 'SCORPION', 'ELEPHANT', 'FLAMINGO', 'MUSHROOM', 'SNOWBALL', 'PRINCESS', 'CALENDAR', 'NECKLACE',
        'SAILBOAT', 'AIRPLANE', 'SKELETON', 'BACKPACK', 'LOLLIPOP', 'SANDWICH', 'BIRTHDAY', 'BROCCOLI', 'UMBRELLA', 'COMPUTER',
        'SQUIRREL', 'KANGAROO', 'DUCKLING', 'REINDEER', 'TORTOISE', 'PHEASANT', 'SEAHORSE', 'STARFISH', 'PORRIDGE', 'PANCAKES',
        'CUPCAKES', 'POPSICLE', 'DOUGHNUT', 'CABBAGES', 'CUCUMBER', 'MEATBALL', 'DUMPLING', 'BLANKETS', 'SLIPPERS', 'TRACTORS',
    ],
};
