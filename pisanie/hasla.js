const lang = localStorage.getItem('lang') || 'pl';

function toggleLang() {
    localStorage.setItem('lang', lang === 'pl' ? 'en' : 'pl');
    location.reload();
}

(function() {
    const btn = document.getElementById('lang-toggle');
    if (lang === 'en') {
        btn.innerHTML = '<img src="https://flagcdn.com/24x18/gb.png" width="24" height="18" alt="English" style="display:block;border-radius:3px;">';
        btn.style.background = 'rgba(255,255,255,0.35)';
        btn.style.border = '2px solid rgba(255,255,255,0.9)';
        document.getElementById('page-title').textContent = '📋 Words';
    } else {
        btn.innerHTML = '<img src="https://flagcdn.com/24x18/pl.png" width="24" height="18" alt="Polski" style="display:block;border-radius:3px;">';
        btn.style.background = 'rgba(255,255,255,0.35)';
        btn.style.border = '2px solid rgba(255,255,255,0.9)';
    }
})();

const LEVELS = [
    { label: 'Poziom 1 – słowa 3-literowe', words: [
        { word:'KOT',      emoji:'🐱' },
        { word:'LEW',      emoji:'🦁' },
        { word:'KOŃ',      emoji:'🐴' },
        { word:'MIŚ',      emoji:'🐻' },
        { word:'JEŻ',      emoji:'🦔' },
        { word:'SER',      emoji:'🧀' },
        { word:'BUS',      emoji:'🚌' },
        { word:'DOM',      emoji:'🏠' },
        { word:'LÓD',      emoji:'🧊' },
        { word:'GRA',      emoji:'🎮' },
        { word:'LIS',      emoji:'🦊' },
        { word:'WĄŻ',      emoji:'🐍' },
        { word:'GĘŚ',      emoji:'<img src="images/ges.svg" alt="gęś">' },
        { word:'SOK',      emoji:'🧃' },
        { word:'OKO',      emoji:'👁️'  },
        { word:'NOS',      emoji:'👃' },
        { word:'RAK',      emoji:'🦞' },
        { word:'ŁOŚ',      emoji:'🦌' },
        { word:'ŻUK',      emoji:'🐞' },
        { word:'MOP',      emoji:'🧹' },
    ]},
    { label: 'Poziom 2 – słowa 4-literowe', words: [
        { word:'RYBA',     emoji:'🐟' },
        { word:'ŻABA',     emoji:'🐸' },
        { word:'KURA',     emoji:'🐔' },
        { word:'PIES',     emoji:'🐕' },
        { word:'KOZA',     emoji:'🐐' },
        { word:'OWCA',     emoji:'🐑' },
        { word:'KRAB',     emoji:'🦀' },
        { word:'MYSZ',     emoji:'🐭' },
        { word:'TORT',     emoji:'🎂' },
        { word:'LODY',     emoji:'🍦' },
        { word:'ŁÓDŹ',     emoji:'⛵' },
        { word:'WODA',     emoji:'💧' },
        { word:'AUTO',     emoji:'🚗' },
        { word:'FOKA',     emoji:'<img src="images/foka.svg" alt="foka">' },
        { word:'SŁOŃ',     emoji:'🐘' },
        { word:'ZUPA',     emoji:'🍲' },
        { word:'MAPA',     emoji:'🗺️'  },
        { word:'LAMA',     emoji:'🦙' },
        { word:'MOST',     emoji:'🌉' },
        { word:'OKNO',     emoji:'<img src="images/okno.svg" alt="okno">' },
    ]},
    { label: 'Poziom 3 – słowa 5-literowe', words: [
        { word:'KOTEK',    emoji:'🐱' },
        { word:'MAŁPA',    emoji:'🐒' },
        { word:'ZEBRA',    emoji:'🦓' },
        { word:'PANDA',    emoji:'🐼' },
        { word:'LISEK',    emoji:'🦊' },
        { word:'KROWA',    emoji:'🐄' },
        { word:'KUCYK',    emoji:'🐴' },
        { word:'PIŁKA',    emoji:'⚽' },
        { word:'PIZZA',    emoji:'🍕' },
        { word:'ZAMEK',    emoji:'🏰' },
        { word:'ZAJĄC',    emoji:'🐰' },
        { word:'ROWER',    emoji:'🚲' },
        { word:'GRZYB',    emoji:'🍄' },
        { word:'TRAWA',    emoji:'🌿' },
        { word:'KWIAT',    emoji:'🌸' },
        { word:'ANIOŁ',    emoji:'👼' },
        { word:'KOGUT',    emoji:'🐓' },
        { word:'KONIK',    emoji:'🐴' },
        { word:'MISIO',    emoji:'🧸' },
        { word:'ROBOT',    emoji:'🤖' },
    ]},
    { label: 'Poziom 4 – słowa 6-literowe', words: [
        { word:'TYGRYS',   emoji:'🐯' },
        { word:'ŻYRAFA',   emoji:'🦒' },
        { word:'MRÓWKA',   emoji:'🐜' },
        { word:'KRÓLIK',   emoji:'🐰' },
        { word:'POCIĄG',   emoji:'🚂' },
        { word:'SŁONIK',   emoji:'🐘' },
        { word:'ŚWINKA',   emoji:'🐷' },
        { word:'BAŁWAN',   emoji:'⛄' },
        { word:'KANGUR',   emoji:'🦘' },
        { word:'WRÓBEL',   emoji:'🐦' },
        { word:'KACZKA',   emoji:'🦆' },
        { word:'JABŁKO',   emoji:'🍎' },
        { word:'STATEK',   emoji:'🚢' },
        { word:'PAPUGA',   emoji:'🦜' },
        { word:'CHOMIK',   emoji:'🐹' },
        { word:'SYRENA',   emoji:'🧜' },
        { word:'WIADRO',   emoji:'<img src="images/wiadro.svg" alt="wiadro">' },
        { word:'ŚLIMAK',   emoji:'🐌' },
        { word:'NOŻYCE',   emoji:'✂️'  },
        { word:'OŁÓWEK',   emoji:'✏️'  },
    ]},
    { label: 'Poziom 5 – słowa 7-literowe', words: [
        { word:'PINGWIN',  emoji:'🐧' },
        { word:'SŁONICA',  emoji:'🐘' },
        { word:'PAPUŻKA',  emoji:'🦜' },
        { word:'CHMURKA',  emoji:'☁️'  },
        { word:'CIĄGNIK',  emoji:'🚜' },
        { word:'GWIAZDA',  emoji:'⭐' },
        { word:'KSIĘŻYC',  emoji:'🌙' },
        { word:'RAKIETA',  emoji:'🚀' },
        { word:'TRAMWAJ',  emoji:'🚋' },
        { word:'RENIFER',  emoji:'🦌' },
        { word:'SAMOLOT',  emoji:'✈️'  },
        { word:'PARASOL',  emoji:'☂️'  },
        { word:'TORNADO',  emoji:'🌪️'  },
        { word:'TRÓJKĄT',  emoji:'📐' },
        { word:'BATERIA',  emoji:'🔋' },
        { word:'LODÓWKA',  emoji:'🧊' },
        { word:'TULIPAN',  emoji:'🌷' },
        { word:'LAMPION',  emoji:'🏮' },
        { word:'HERBATA',  emoji:'☕' },
        { word:'KOSMITA',  emoji:'👽' },
    ]},
    { label: 'Poziom 6 – słowa 8-literowe', words: [
        { word:'KROKODYL', emoji:'🐊' },
        { word:'DINOZAUR', emoji:'🦕' },
        { word:'MOTOCYKL', emoji:'🏍️'  },
        { word:'WIELBŁĄD', emoji:'🐪' },
        { word:'LALECZKI', emoji:'🎎' },
        { word:'KRÓLEWNA', emoji:'👸' },
        { word:'PSZCZOŁA', emoji:'🐝' },
        { word:'CUKIEREK', emoji:'🍬' },
        { word:'BAŁWANEK', emoji:'⛄' },
        { word:'RYCERZYK', emoji:'⚔️'  },
        { word:'KAPELUSZ', emoji:'🎩' },
        { word:'GWIAZDKA', emoji:'⭐' },
        { word:'NARCIARZ', emoji:'⛷️'  },
        { word:'KASZTANY', emoji:'🌰' },
        { word:'PIEROŻEK', emoji:'🥟' },
        { word:'MIKROFON', emoji:'🎤' },
        { word:'PATELNIA', emoji:'🍳' },
        { word:'MUCHOMOR', emoji:'🍄' },
        { word:'WIELORYB', emoji:'🐋' },
        { word:'SZKIELET', emoji:'💀' },
    ]},
];

const LEVELS_EN = [
    { label: 'Level 1 – 3-letter words', words: [
        { word:'CAT',      emoji:'🐱' },
        { word:'DOG',      emoji:'🐕' },
        { word:'COW',      emoji:'🐄' },
        { word:'PIG',      emoji:'🐷' },
        { word:'HEN',      emoji:'🐔' },
        { word:'EGG',      emoji:'🥚' },
        { word:'BUS',      emoji:'🚌' },
        { word:'CAR',      emoji:'🚗' },
        { word:'SUN',      emoji:'☀️'  },
        { word:'ANT',      emoji:'🐜' },
        { word:'BEE',      emoji:'🐝' },
        { word:'FOX',      emoji:'🦊' },
        { word:'OWL',      emoji:'🦉' },
        { word:'BAT',      emoji:'🦇' },
        { word:'FLY',      emoji:'🪰' },
        { word:'HAT',      emoji:'🎩' },
        { word:'CUP',      emoji:'☕' },
        { word:'MAP',      emoji:'🗺️'  },
        { word:'KEY',      emoji:'🔑' },
        { word:'BOX',      emoji:'📦' },
    ]},
    { label: 'Level 2 – 4-letter words', words: [
        { word:'BEAR',     emoji:'🐻' },
        { word:'DUCK',     emoji:'🦆' },
        { word:'FROG',     emoji:'🐸' },
        { word:'GOAT',     emoji:'🐐' },
        { word:'FISH',     emoji:'🐟' },
        { word:'CRAB',     emoji:'🦀' },
        { word:'LAMB',     emoji:'🐑' },
        { word:'LION',     emoji:'🦁' },
        { word:'WOLF',     emoji:'🐺' },
        { word:'DEER',     emoji:'🦌' },
        { word:'SEAL',     emoji:'<img src="images/foka.svg" alt="seal">' },
        { word:'TREE',     emoji:'🌲' },
        { word:'CAKE',     emoji:'🎂' },
        { word:'MILK',     emoji:'🥛' },
        { word:'STAR',     emoji:'⭐' },
        { word:'BOOK',     emoji:'📚' },
        { word:'SHIP',     emoji:'🚢' },
        { word:'DOOR',     emoji:'🚪' },
        { word:'BIRD',     emoji:'🐦' },
        { word:'ROSE',     emoji:'🌹' },
    ]},
    { label: 'Level 3 – 5-letter words', words: [
        { word:'HORSE',    emoji:'🐴' },
        { word:'SNAKE',    emoji:'🐍' },
        { word:'TIGER',    emoji:'🐯' },
        { word:'PANDA',    emoji:'🐼' },
        { word:'ZEBRA',    emoji:'🦓' },
        { word:'KOALA',    emoji:'🐨' },
        { word:'SHARK',    emoji:'🦈' },
        { word:'WHALE',    emoji:'🐋' },
        { word:'EAGLE',    emoji:'🦅' },
        { word:'MOUSE',    emoji:'🐭' },
        { word:'GOOSE',    emoji:'<img src="images/ges.svg" alt="goose">' },
        { word:'DAISY',    emoji:'🌼' },
        { word:'PIZZA',    emoji:'🍕' },
        { word:'APPLE',    emoji:'🍎' },
        { word:'GRAPE',    emoji:'🍇' },
        { word:'LEMON',    emoji:'🍋' },
        { word:'TRAIN',    emoji:'🚂' },
        { word:'CLOCK',    emoji:'🕐' },
        { word:'ROBOT',    emoji:'🤖' },
        { word:'PIANO',    emoji:'🎹' },
    ]},
    { label: 'Level 4 – 6-letter words', words: [
        { word:'PARROT',   emoji:'🦜' },
        { word:'RABBIT',   emoji:'🐰' },
        { word:'MONKEY',   emoji:'🐒' },
        { word:'TURTLE',   emoji:'🐢' },
        { word:'SPIDER',   emoji:'🕷️'  },
        { word:'CASTLE',   emoji:'🏰' },
        { word:'BRIDGE',   emoji:'🌉' },
        { word:'ROCKET',   emoji:'🚀' },
        { word:'PENCIL',   emoji:'✏️'  },
        { word:'FLOWER',   emoji:'🌸' },
        { word:'CHERRY',   emoji:'🍒' },
        { word:'COOKIE',   emoji:'🍪' },
        { word:'DRAGON',   emoji:'🐉' },
        { word:'GUITAR',   emoji:'🎸' },
        { word:'DONKEY',   emoji:'🫏' },
        { word:'MIRROR',   emoji:'🪞' },
        { word:'CARROT',   emoji:'🥕' },
        { word:'WINDOW',   emoji:'<img src="images/okno.svg" alt="window">' },
        { word:'BUCKET',   emoji:'<img src="images/wiadro.svg" alt="bucket">' },
        { word:'PIGEON',   emoji:'🐦' },
    ]},
    { label: 'Level 5 – 7-letter words', words: [
        { word:'PENGUIN',  emoji:'🐧' },
        { word:'DOLPHIN',  emoji:'🐬' },
        { word:'GIRAFFE',  emoji:'🦒' },
        { word:'LEOPARD',  emoji:'🐆' },
        { word:'CHICKEN',  emoji:'🐔' },
        { word:'LOBSTER',  emoji:'🦞' },
        { word:'HAMSTER',  emoji:'🐹' },
        { word:'OCTOPUS',  emoji:'🐙' },
        { word:'PEACOCK',  emoji:'🦚' },
        { word:'RAINBOW',  emoji:'🌈' },
        { word:'BALLOON',  emoji:'🎈' },
        { word:'LANTERN',  emoji:'🏮' },
        { word:'BICYCLE',  emoji:'🚲' },
        { word:'TRUMPET',  emoji:'🎺' },
        { word:'DIAMOND',  emoji:'💎' },
        { word:'PUMPKIN',  emoji:'🎃' },
        { word:'MERMAID',  emoji:'🧜' },
        { word:'COMPASS',  emoji:'🧭' },
        { word:'PRESENT',  emoji:'🎁' },
        { word:'SAUSAGE',  emoji:'🌭' },
    ]},
    { label: 'Level 6 – 8-letter words', words: [
        { word:'DINOSAUR', emoji:'🦕' },
        { word:'HEDGEHOG', emoji:'🦔' },
        { word:'SCORPION', emoji:'🦂' },
        { word:'ELEPHANT', emoji:'🐘' },
        { word:'FLAMINGO', emoji:'🦩' },
        { word:'MUSHROOM', emoji:'🍄' },
        { word:'SNOWBALL', emoji:'❄️'  },
        { word:'PRINCESS', emoji:'👸' },
        { word:'CALENDAR', emoji:'📅' },
        { word:'NECKLACE', emoji:'📿' },
        { word:'SAILBOAT', emoji:'⛵' },
        { word:'AIRPLANE', emoji:'✈️'  },
        { word:'SKELETON', emoji:'💀' },
        { word:'BACKPACK', emoji:'🎒' },
        { word:'LOLLIPOP', emoji:'🍭' },
        { word:'SANDWICH', emoji:'🥪' },
        { word:'BIRTHDAY', emoji:'🎂' },
        { word:'BROCCOLI', emoji:'🥦' },
        { word:'UMBRELLA', emoji:'☂️'  },
        { word:'COMPUTER', emoji:'💻' },
    ]},
];

const ACTIVE_LEVELS = lang === 'en' ? LEVELS_EN : LEVELS;
const container = document.body;

ACTIVE_LEVELS.forEach(level => {
    const section = document.createElement('div');
    section.className = 'level-section';

    const title = document.createElement('div');
    title.className = 'level-title';
    title.textContent = level.label;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'words-grid';

    level.words.forEach(({ word, emoji }) => {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `<span class="word-icon">${emoji}</span><span class="word-text">${word}</span>`;
        grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
});
