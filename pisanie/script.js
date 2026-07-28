/* ─────────────── Language ─────────────── */
const lang = localStorage.getItem('lang') || 'pl';

function setLang(l) {
    localStorage.setItem('lang', l);
    location.reload();
}

/* ─────────────── Module (obrazki / słuchanie) ─────────────── */
const mode = localStorage.getItem('pisanieMode') || 'images';   // 'images' | 'listen'

function setMode(m) {
    localStorage.setItem('pisanieMode', m);
    location.reload();
}

(function() {
    const btnPl = document.getElementById('lang-pl');
    const btnEn = document.getElementById('lang-en');
    const activeStyle = { background: 'rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.9)' };
    const inactiveStyle = { background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' };
    if (lang === 'en') {
        Object.assign(btnEn.style, activeStyle);
        Object.assign(btnPl.style, inactiveStyle);
    } else {
        Object.assign(btnPl.style, activeStyle);
        Object.assign(btnEn.style, inactiveStyle);
    }
    document.getElementById('words-link').textContent = lang === 'en' ? 'words' : 'hasła';
    document.getElementById('hint-btn').textContent   = lang === 'en' ? '💡 Hint' : '💡 Podpowiedź';
    document.getElementById('check-btn').textContent  = lang === 'en' ? 'Check' : 'Sprawdź';
    document.getElementById('ov-title').textContent   = lang === 'en' ? 'Excellent!' : 'Świetnie!';
    document.getElementById('ov-text').textContent    = lang === 'en' ? 'Well done!' : 'Brawo!';
    document.getElementById('ov-btn').textContent     = lang === 'en' ? 'Next →' : 'Dalej →';

    // przełącznik modułów
    document.querySelector('#mode-images span').textContent = lang === 'en' ? 'Pictures' : 'Obrazki';
    document.querySelector('#mode-listen span').textContent = lang === 'en' ? 'Listening' : 'Słuchanie';
    document.getElementById('mode-' + mode).classList.add('active');
    document.body.classList.add('mode-' + mode);

    // ukryj głośnik, gdy przeglądarka nie wspiera syntezy mowy
    if (!('speechSynthesis' in window)) {
        const sb = document.getElementById('speak-btn');
        if (sb) sb.style.display = 'none';
        // w module słuchania głośnik jest niezbędny — pokaż ostrzeżenie w podpowiedzi
        if (mode === 'listen') {
            const wh = document.getElementById('word-hint');
            wh.textContent = lang === 'en' ? '(speech not supported)' : '(brak syntezy mowy)';
        }
    }
})();

/* ─────────────── Word data ─────────────── */
const LEVELS = [
    [ // 3 letters
        { word:'KOT',      emoji:'🐱', hint:'kot'      },
        { word:'LEW',      emoji:'🦁', hint:'lew'      },
        { word:'KOŃ',      emoji:'🐴', hint:'koń'      },
        { word:'MIŚ',      emoji:'🐻', hint:'miś'      },
        { word:'JEŻ',      emoji:'🦔', hint:'jeż'      },
        { word:'SER',      emoji:'🧀', hint:'ser'      },
        { word:'BUS',      emoji:'🚌', hint:'bus'      },
        { word:'DOM',      emoji:'🏠', hint:'dom'      },
        { word:'LÓD',      emoji:'🧊', hint:'lód'      },
        { word:'GRA',      emoji:'🎮', hint:'gra'      },
        { word:'LIS',      emoji:'🦊', hint:'lis'      },
        { word:'WĄŻ',      emoji:'🐍', hint:'wąż'      },
        { word:'GĘŚ',      emoji:'<img src="images/ges.svg" alt="gęś">', hint:'gęś'      },
        { word:'SOK',      emoji:'🧃', hint:'sok'      },
        { word:'OKO',      emoji:'👁️',  hint:'oko'      },
        { word:'NOS',      emoji:'👃', hint:'nos'      },
        { word:'RAK',      emoji:'🦞', hint:'rak'      },
        { word:'ŁOŚ',      emoji:'🦌', hint:'łoś'      },
        { word:'ŻUK',      emoji:'🐞', hint:'żuk'      },
        { word:'MOP',      emoji:'🧹', hint:'mop'      },
    ],
    [ // 4 letters
        { word:'RYBA',     emoji:'🐟', hint:'ryba'     },
        { word:'ŻABA',     emoji:'🐸', hint:'żaba'     },
        { word:'KURA',     emoji:'🐔', hint:'kura'     },
        { word:'PIES',     emoji:'🐕', hint:'pies'     },
        { word:'KOZA',     emoji:'🐐', hint:'koza'     },
        { word:'OWCA',     emoji:'🐑', hint:'owca'     },
        { word:'KRAB',     emoji:'🦀', hint:'krab'     },
        { word:'MYSZ',     emoji:'🐭', hint:'mysz'     },
        { word:'TORT',     emoji:'🎂', hint:'tort'     },
        { word:'LODY',     emoji:'🍦', hint:'lody'     },
        { word:'ŁÓDŹ',     emoji:'⛵', hint:'łódź'     },
        { word:'WODA',     emoji:'💧', hint:'woda'     },
        { word:'AUTO',     emoji:'🚗', hint:'auto'     },
        { word:'FOKA',     emoji:'<img src="images/foka.svg" alt="foka">', hint:'foka'     },
        { word:'SŁOŃ',     emoji:'🐘', hint:'słoń'     },
        { word:'ZUPA',     emoji:'🍲', hint:'zupa'     },
        { word:'MAPA',     emoji:'🗺️',  hint:'mapa'     },
        { word:'LAMA',     emoji:'🦙', hint:'lama'     },
        { word:'MOST',     emoji:'🌉', hint:'most'     },
        { word:'OKNO',     emoji:'<img src="images/okno.svg" alt="okno">', hint:'okno'     },
    ],
    [ // 5 letters
        { word:'KOTEK',    emoji:'🐱', hint:'kotek'    },
        { word:'MAŁPA',    emoji:'🐒', hint:'małpa'    },
        { word:'ZEBRA',    emoji:'🦓', hint:'zebra'    },
        { word:'PANDA',    emoji:'🐼', hint:'panda'    },
        { word:'LISEK',    emoji:'🦊', hint:'lisek'    },
        { word:'KROWA',    emoji:'🐄', hint:'krowa'    },
        { word:'KUCYK',    emoji:'🐴', hint:'kucyk'    },
        { word:'PIŁKA',    emoji:'⚽', hint:'piłka'    },
        { word:'PIZZA',    emoji:'🍕', hint:'pizza'    },
        { word:'ZAMEK',    emoji:'🏰', hint:'zamek'    },
        { word:'ZAJĄC',    emoji:'🐰', hint:'zając'    },
        { word:'ROWER',    emoji:'🚲', hint:'rower'    },
        { word:'GRZYB',    emoji:'🍄', hint:'grzyb'    },
        { word:'TRAWA',    emoji:'🌿', hint:'trawa'    },
        { word:'KWIAT',    emoji:'🌸', hint:'kwiat'    },
        { word:'ANIOŁ',    emoji:'👼', hint:'anioł'    },
        { word:'KOGUT',    emoji:'🐓', hint:'kogut'    },
        { word:'KONIK',    emoji:'🐴', hint:'konik'    },
        { word:'MISIO',    emoji:'🧸', hint:'misio'    },
        { word:'ROBOT',    emoji:'🤖', hint:'robot'    },
    ],
    [ // 6 letters
        { word:'TYGRYS',   emoji:'🐯', hint:'tygrys'   },
        { word:'ŻYRAFA',   emoji:'🦒', hint:'żyrafa'   },
        { word:'MRÓWKA',   emoji:'🐜', hint:'mrówka'   },
        { word:'KRÓLIK',   emoji:'🐰', hint:'królik'   },
        { word:'POCIĄG',   emoji:'🚂', hint:'pociąg'   },
        { word:'SŁONIK',   emoji:'🐘', hint:'słonik'   },
        { word:'ŚWINKA',   emoji:'🐷', hint:'świnka'   },
        { word:'BAŁWAN',   emoji:'⛄', hint:'bałwan'   },
        { word:'KANGUR',   emoji:'🦘', hint:'kangur'   },
        { word:'WRÓBEL',   emoji:'🐦', hint:'wróbel'   },
        { word:'KACZKA',   emoji:'🦆', hint:'kaczka'   },
        { word:'JABŁKO',   emoji:'🍎', hint:'jabłko'   },
        { word:'STATEK',   emoji:'🚢', hint:'statek'   },
        { word:'PAPUGA',   emoji:'🦜', hint:'papuga'   },
        { word:'CHOMIK',   emoji:'🐹', hint:'chomik'   },
        { word:'SYRENA',   emoji:'🧜', hint:'syrena'   },
        { word:'WIADRO',   emoji:'<img src="images/wiadro.svg" alt="wiadro">', hint:'wiadro'   },
        { word:'ŚLIMAK',   emoji:'🐌', hint:'ślimak'   },
        { word:'NOŻYCE',   emoji:'✂️',  hint:'nożyce'   },
        { word:'OŁÓWEK',   emoji:'✏️',  hint:'ołówek'   },
    ],
    [ // 7 letters
        { word:'PINGWIN',  emoji:'🐧', hint:'pingwin'  },
        { word:'SŁONICA',  emoji:'🐘', hint:'słonica'  },
        { word:'PAPUŻKA',  emoji:'🦜', hint:'papużka'  },
        { word:'CHMURKA',  emoji:'☁️',  hint:'chmurka'  },
        { word:'CIĄGNIK',  emoji:'🚜', hint:'ciągnik'  },
        { word:'GWIAZDA',  emoji:'⭐', hint:'gwiazda'  },
        { word:'KSIĘŻYC',  emoji:'🌙', hint:'księżyc'  },
        { word:'RAKIETA',  emoji:'🚀', hint:'rakieta'  },
        { word:'TRAMWAJ',  emoji:'🚋', hint:'tramwaj'  },
        { word:'RENIFER',  emoji:'🦌', hint:'renifer'  },
        { word:'SAMOLOT',  emoji:'✈️',  hint:'samolot'  },
        { word:'PARASOL',  emoji:'☂️',  hint:'parasol'  },
        { word:'TORNADO',  emoji:'🌪️',  hint:'tornado'  },
        { word:'TRÓJKĄT',  emoji:'📐', hint:'trójkąt'  },
        { word:'BATERIA',  emoji:'🔋', hint:'bateria'  },
        { word:'LODÓWKA',  emoji:'🧊', hint:'lodówka'  },
        { word:'TULIPAN',  emoji:'🌷', hint:'tulipan'  },
        { word:'LAMPION',  emoji:'🏮', hint:'lampion'  },
        { word:'HERBATA',  emoji:'☕', hint:'herbata'  },
        { word:'KOSMITA',  emoji:'👽', hint:'kosmita'  },
    ],
    [ // 8 letters
        { word:'KROKODYL', emoji:'🐊', hint:'krokodyl' },
        { word:'DINOZAUR', emoji:'🦕', hint:'dinozaur' },
        { word:'MOTOCYKL', emoji:'🏍️',  hint:'motocykl' },
        { word:'WIELBŁĄD', emoji:'🐪', hint:'wielbłąd' },
        { word:'LALECZKI', emoji:'🎎', hint:'laleczki' },
        { word:'KRÓLEWNA', emoji:'👸', hint:'królewna' },
        { word:'PSZCZOŁA', emoji:'🐝', hint:'pszczoła' },
        { word:'CUKIEREK', emoji:'🍬', hint:'cukierek' },
        { word:'BAŁWANEK', emoji:'⛄', hint:'bałwanek' },
        { word:'RYCERZYK', emoji:'⚔️',  hint:'rycerzyk' },
        { word:'KAPELUSZ', emoji:'🎩', hint:'kapelusz' },
        { word:'GWIAZDKA', emoji:'⭐', hint:'gwiazdka' },
        { word:'NARCIARZ', emoji:'⛷️',  hint:'narciarz' },
        { word:'KASZTANY', emoji:'🌰', hint:'kasztany' },
        { word:'PIEROŻEK', emoji:'🥟', hint:'pierożek' },
        { word:'MIKROFON', emoji:'🎤', hint:'mikrofon' },
        { word:'PATELNIA', emoji:'🍳', hint:'patelnia' },
        { word:'MUCHOMOR', emoji:'🍄', hint:'muchomor' },
        { word:'WIELORYB', emoji:'🐋', hint:'wieloryb' },
        { word:'SZKIELET', emoji:'💀', hint:'szkielet' },
    ],
];

const LEVELS_EN = [
    [ // 3 letters
        { word:'CAT',      emoji:'🐱', hint:'cat'      },
        { word:'DOG',      emoji:'🐕', hint:'dog'      },
        { word:'COW',      emoji:'🐄', hint:'cow'      },
        { word:'PIG',      emoji:'🐷', hint:'pig'      },
        { word:'HEN',      emoji:'🐔', hint:'hen'      },
        { word:'EGG',      emoji:'🥚', hint:'egg'      },
        { word:'BUS',      emoji:'🚌', hint:'bus'      },
        { word:'CAR',      emoji:'🚗', hint:'car'      },
        { word:'SUN',      emoji:'☀️',  hint:'sun'      },
        { word:'ANT',      emoji:'🐜', hint:'ant'      },
        { word:'BEE',      emoji:'🐝', hint:'bee'      },
        { word:'FOX',      emoji:'🦊', hint:'fox'      },
        { word:'OWL',      emoji:'🦉', hint:'owl'      },
        { word:'BAT',      emoji:'🦇', hint:'bat'      },
        { word:'FLY',      emoji:'🪰', hint:'fly'      },
        { word:'HAT',      emoji:'🎩', hint:'hat'      },
        { word:'CUP',      emoji:'☕', hint:'cup'      },
        { word:'MAP',      emoji:'🗺️',  hint:'map'      },
        { word:'KEY',      emoji:'🔑', hint:'key'      },
        { word:'BOX',      emoji:'📦', hint:'box'      },
    ],
    [ // 4 letters
        { word:'BEAR',     emoji:'🐻', hint:'bear'     },
        { word:'DUCK',     emoji:'🦆', hint:'duck'     },
        { word:'FROG',     emoji:'🐸', hint:'frog'     },
        { word:'GOAT',     emoji:'🐐', hint:'goat'     },
        { word:'FISH',     emoji:'🐟', hint:'fish'     },
        { word:'CRAB',     emoji:'🦀', hint:'crab'     },
        { word:'LAMB',     emoji:'🐑', hint:'lamb'     },
        { word:'LION',     emoji:'🦁', hint:'lion'     },
        { word:'WOLF',     emoji:'🐺', hint:'wolf'     },
        { word:'DEER',     emoji:'🦌', hint:'deer'     },
        { word:'SEAL',     emoji:'<img src="images/foka.svg" alt="seal">', hint:'seal'     },
        { word:'TREE',     emoji:'🌲', hint:'tree'     },
        { word:'CAKE',     emoji:'🎂', hint:'cake'     },
        { word:'MILK',     emoji:'🥛', hint:'milk'     },
        { word:'STAR',     emoji:'⭐', hint:'star'     },
        { word:'BOOK',     emoji:'📚', hint:'book'     },
        { word:'SHIP',     emoji:'🚢', hint:'ship'     },
        { word:'DOOR',     emoji:'🚪', hint:'door'     },
        { word:'BIRD',     emoji:'🐦', hint:'bird'     },
        { word:'ROSE',     emoji:'🌹', hint:'rose'     },
    ],
    [ // 5 letters
        { word:'HORSE',    emoji:'🐴', hint:'horse'    },
        { word:'SNAKE',    emoji:'🐍', hint:'snake'    },
        { word:'TIGER',    emoji:'🐯', hint:'tiger'    },
        { word:'PANDA',    emoji:'🐼', hint:'panda'    },
        { word:'ZEBRA',    emoji:'🦓', hint:'zebra'    },
        { word:'KOALA',    emoji:'🐨', hint:'koala'    },
        { word:'SHARK',    emoji:'🦈', hint:'shark'    },
        { word:'WHALE',    emoji:'🐋', hint:'whale'    },
        { word:'EAGLE',    emoji:'🦅', hint:'eagle'    },
        { word:'MOUSE',    emoji:'🐭', hint:'mouse'    },
        { word:'GOOSE',    emoji:'<img src="images/ges.svg" alt="goose">', hint:'goose'    },
        { word:'DAISY',    emoji:'🌼', hint:'daisy'    },
        { word:'PIZZA',    emoji:'🍕', hint:'pizza'    },
        { word:'APPLE',    emoji:'🍎', hint:'apple'    },
        { word:'GRAPE',    emoji:'🍇', hint:'grape'    },
        { word:'LEMON',    emoji:'🍋', hint:'lemon'    },
        { word:'TRAIN',    emoji:'🚂', hint:'train'    },
        { word:'CLOCK',    emoji:'🕐', hint:'clock'    },
        { word:'ROBOT',    emoji:'🤖', hint:'robot'    },
        { word:'PIANO',    emoji:'🎹', hint:'piano'    },
    ],
    [ // 6 letters
        { word:'PARROT',   emoji:'🦜', hint:'parrot'   },
        { word:'RABBIT',   emoji:'🐰', hint:'rabbit'   },
        { word:'MONKEY',   emoji:'🐒', hint:'monkey'   },
        { word:'TURTLE',   emoji:'🐢', hint:'turtle'   },
        { word:'SPIDER',   emoji:'🕷️',  hint:'spider'   },
        { word:'CASTLE',   emoji:'🏰', hint:'castle'   },
        { word:'BRIDGE',   emoji:'🌉', hint:'bridge'   },
        { word:'ROCKET',   emoji:'🚀', hint:'rocket'   },
        { word:'PENCIL',   emoji:'✏️',  hint:'pencil'   },
        { word:'FLOWER',   emoji:'🌸', hint:'flower'   },
        { word:'CHERRY',   emoji:'🍒', hint:'cherry'   },
        { word:'COOKIE',   emoji:'🍪', hint:'cookie'   },
        { word:'DRAGON',   emoji:'🐉', hint:'dragon'   },
        { word:'GUITAR',   emoji:'🎸', hint:'guitar'   },
        { word:'DONKEY',   emoji:'🫏', hint:'donkey'   },
        { word:'MIRROR',   emoji:'🪞', hint:'mirror'   },
        { word:'CARROT',   emoji:'🥕', hint:'carrot'   },
        { word:'WINDOW',   emoji:'<img src="images/okno.svg" alt="window">', hint:'window'   },
        { word:'BUCKET',   emoji:'<img src="images/wiadro.svg" alt="bucket">', hint:'bucket'   },
        { word:'PIGEON',   emoji:'🐦', hint:'pigeon'   },
    ],
    [ // 7 letters
        { word:'PENGUIN',  emoji:'🐧', hint:'penguin'  },
        { word:'DOLPHIN',  emoji:'🐬', hint:'dolphin'  },
        { word:'GIRAFFE',  emoji:'🦒', hint:'giraffe'  },
        { word:'LEOPARD',  emoji:'🐆', hint:'leopard'  },
        { word:'CHICKEN',  emoji:'🐔', hint:'chicken'  },
        { word:'LOBSTER',  emoji:'🦞', hint:'lobster'  },
        { word:'HAMSTER',  emoji:'🐹', hint:'hamster'  },
        { word:'OCTOPUS',  emoji:'🐙', hint:'octopus'  },
        { word:'PEACOCK',  emoji:'🦚', hint:'peacock'  },
        { word:'RAINBOW',  emoji:'🌈', hint:'rainbow'  },
        { word:'BALLOON',  emoji:'🎈', hint:'balloon'  },
        { word:'LANTERN',  emoji:'🏮', hint:'lantern'  },
        { word:'BICYCLE',  emoji:'🚲', hint:'bicycle'  },
        { word:'TRUMPET',  emoji:'🎺', hint:'trumpet'  },
        { word:'DIAMOND',  emoji:'💎', hint:'diamond'  },
        { word:'PUMPKIN',  emoji:'🎃', hint:'pumpkin'  },
        { word:'MERMAID',  emoji:'🧜', hint:'mermaid'  },
        { word:'COMPASS',  emoji:'🧭', hint:'compass'  },
        { word:'PRESENT',  emoji:'🎁', hint:'present'  },
        { word:'SAUSAGE',  emoji:'🌭', hint:'sausage'  },
    ],
    [ // 8 letters
        { word:'DINOSAUR', emoji:'🦕', hint:'dinosaur' },
        { word:'HEDGEHOG', emoji:'🦔', hint:'hedgehog' },
        { word:'SCORPION', emoji:'🦂', hint:'scorpion' },
        { word:'ELEPHANT', emoji:'🐘', hint:'elephant' },
        { word:'FLAMINGO', emoji:'🦩', hint:'flamingo' },
        { word:'MUSHROOM', emoji:'🍄', hint:'mushroom' },
        { word:'SNOWBALL', emoji:'❄️',  hint:'snowball' },
        { word:'PRINCESS', emoji:'👸', hint:'princess' },
        { word:'CALENDAR', emoji:'📅', hint:'calendar' },
        { word:'NECKLACE', emoji:'📿', hint:'necklace' },
        { word:'SAILBOAT', emoji:'⛵', hint:'sailboat' },
        { word:'AIRPLANE', emoji:'✈️',  hint:'airplane' },
        { word:'SKELETON', emoji:'💀', hint:'skeleton' },
        { word:'BACKPACK', emoji:'🎒', hint:'backpack' },
        { word:'LOLLIPOP', emoji:'🍭', hint:'lollipop' },
        { word:'SANDWICH', emoji:'🥪', hint:'sandwich' },
        { word:'BIRTHDAY', emoji:'🎂', hint:'birthday' },
        { word:'BROCCOLI', emoji:'🥦', hint:'broccoli' },
        { word:'UMBRELLA', emoji:'☂️',  hint:'umbrella' },
        { word:'COMPUTER', emoji:'💻', hint:'computer' },
    ],
];

/* Moduł "Słuchanie" — buduj poziomy ze słów bez obrazka (words-listen.js) */
function buildListenLevels() {
    const data = lang === 'en' ? LISTEN_WORDS_EN : LISTEN_WORDS_PL;
    return [3, 4, 5, 6, 7, 8].map(len =>
        (data[len] || []).map(w => ({ word: w, emoji: '', hint: w.toLowerCase() }))
    );
}

const ACTIVE_LEVELS = mode === 'listen'
    ? buildListenLevels()
    : (lang === 'en' ? LEVELS_EN : LEVELS);

const EXTRA_POOL    = 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ'.split('');
const EXTRA_POOL_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CONFETTI   = ['🌟','⭐','✨','💫','🎊','🎉','🏅','🌈','🎈','💥'];

/* ─────────────── State ─────────────── */
let level = 0, wordIdx = 0;
let currentLevelWords = [];  // 3 randomly selected words for current level
let pool = [];          // [{id, letter, used}]
let boxes = [];         // [{poolId, letter}] or null per slot
let lockedBoxes = new Set();   // indices verified correct
let wrongBoxes  = new Set();   // indices verified wrong (red)
let hintStage   = 0;           // 0 = brak, 1 = pula odfiltrowana, 2 = słowo pokazane

/* ─────────────── Helpers ─────────────── */
function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function selectLevelWords(levelIdx) {
    currentLevelWords = shuffle(ACTIVE_LEVELS[levelIdx]).slice(0, 3);
}

function makePool(word) {
    const letters  = word.split('');

    // pomieszaj litery słowa tak, by ich kolejność NIE tworzyła poprawnego słowa
    // (dzięki temu po podpowiedzi, która usuwa zbędne litery, rozwiązanie nie jest odsłonięte)
    let wordLetters = shuffle(letters);
    let guard = 0;
    while (letters.length > 1 && wordLetters.join('') === word && guard++ < 30) {
        wordLetters = shuffle(letters);
    }

    const inWord    = new Set(letters);
    const basePool  = lang === 'en' ? EXTRA_POOL_EN : EXTRA_POOL;
    const available = shuffle(basePool.filter(l => !inWord.has(l)));
    const extras    = available.slice(0, Math.min(2, available.length));

    // wstaw dodatkowe litery w losowych miejscach, zachowując kolejność liter słowa
    const items = wordLetters.map(l => ({ letter: l, extra: false }));
    extras.forEach(l => {
        const pos = Math.floor(Math.random() * (items.length + 1));
        items.splice(pos, 0, { letter: l, extra: true });
    });

    return items.map((it, id) => ({ id, letter: it.letter, used: false, extra: it.extra, hidden: false }));
}

/* ─────────────── Render ─────────────── */
function renderAll() {
    renderBoxes();
    renderPool();
    updateCheckBtn();
}

function renderBoxes() {
    const el = document.getElementById('answer-boxes');
    el.innerHTML = '';

    const cardW  = document.getElementById('game-card').clientWidth;
    const avail  = cardW - 36;
    const n      = boxes.length;
    const boxW   = Math.min(58, Math.max(38, Math.floor((avail - 6 * (n - 1)) / n)));
    const fSize  = boxW >= 52 ? '1.5rem' : boxW >= 44 ? '1.25rem' : '1.05rem';

    boxes.forEach((box, i) => {
        const div = document.createElement('div');
        div.className  = 'letter-box';
        div.style.width    = boxW + 'px';
        div.style.fontSize = fSize;

        if (box) {
            div.textContent = box.letter;
            if (lockedBoxes.has(i)) {
                div.classList.add('correct');
            } else if (wrongBoxes.has(i)) {
                div.classList.add('wrong');
                div.addEventListener('click', () => removeBoxLetter(i));
            } else {
                div.classList.add('filled');
                div.addEventListener('click', () => removeBoxLetter(i));
            }
        }
        el.appendChild(div);
    });
}

function renderPool() {
    const el = document.getElementById('letter-pool');
    el.innerHTML = '';
    pool.forEach(item => {
        if (item.hidden) return;           // litera ukryta przez podpowiedź
        const btn = document.createElement('button');
        btn.className   = `pool-btn c${item.id % 10}`;
        btn.textContent = item.letter;
        btn.disabled    = item.used;
        btn.addEventListener('click', () => addLetter(item.id));
        el.appendChild(btn);
    });
}

function updateCheckBtn() {
    const allFilled = boxes.every(b => b !== null);
    const noWrong   = wrongBoxes.size === 0;
    document.getElementById('check-btn').classList.toggle('show', allFilled && noWrong);
}

/* ─────────────── Interactions ─────────────── */
function addLetter(id) {
    const item = pool.find(p => p.id === id);
    if (!item || item.used) return;

    const emptyIdx = boxes.findIndex(b => b === null);
    if (emptyIdx === -1) return;

    item.used = true;
    boxes[emptyIdx] = { poolId: id, letter: item.letter };
    wrongBoxes.delete(emptyIdx);

    renderAll();
}

function removeBoxLetter(idx) {
    if (lockedBoxes.has(idx)) return;
    const box = boxes[idx];
    if (!box) return;

    const item = pool.find(p => p.id === box.poolId);
    if (item) item.used = false;
    boxes[idx] = null;
    wrongBoxes.delete(idx);

    renderAll();
}

function checkAnswer() {
    const word = currentLevelWords[wordIdx].word;
    let allCorrect = true;

    boxes.forEach((box, i) => {
        if (!box) return;
        if (box.letter === word[i]) {
            lockedBoxes.add(i);
            wrongBoxes.delete(i);
        } else {
            wrongBoxes.add(i);
            allCorrect = false;
        }
    });

    document.getElementById('check-btn').classList.remove('show');
    renderAll();

    // odczytaj wpisany wyraz; jeśli błędny — dodaj komunikat
    const entered = boxes.map(b => (b ? b.letter : '')).join('');
    if (allCorrect) {
        speak(entered);
    } else {
        const spoken = entered.toLowerCase();
        speak(lang === 'en'
            ? `${spoken}, is incorrect. Try again.`
            : `${spoken}, jest niepoprawny. Spróbuj ponownie.`);
    }

    if (allCorrect) {
        const emojiEl = document.getElementById('emoji-area');
        emojiEl.classList.remove('emoji-pop', 'emoji-wobble');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            emojiEl.classList.add('emoji-wobble');
        }));
        spawnConfetti();
        setTimeout(() => {
            emojiEl.classList.remove('emoji-wobble');
            advanceWord();
        }, 1700);
    }
}

/* ─────────────── Progress ─────────────── */
function advanceWord() {
    wordIdx++;
    if (wordIdx >= currentLevelWords.length) {
        const isLast = level >= ACTIVE_LEVELS.length - 1;
        document.getElementById('ov-emoji').textContent = isLast ? '🏆' : '🌟';
        if (lang === 'en') {
            document.getElementById('ov-title').textContent = isLast ? 'Congratulations!' : 'Level complete!';
            document.getElementById('ov-text').innerHTML  = isLast
                ? 'You finished all levels!<br>You are a spelling champion! 🏅'
                : `Moving to Level ${level + 2} – ${ACTIVE_LEVELS[level + 1][0].word.length}-letter words!`;
            document.getElementById('ov-btn').textContent  = isLast ? '🔄 Play again' : 'Next level →';
        } else {
            document.getElementById('ov-title').textContent = isLast ? 'Gratulacje!' : 'Poziom zaliczony!';
            document.getElementById('ov-text').innerHTML  = isLast
                ? 'Ukończyłeś wszystkie poziomy!<br>Jesteś mistrzem pisania! 🏅'
                : `Przechodzisz do poziomu ${level + 2} – słowa ${ACTIVE_LEVELS[level + 1][0].word.length}-literowe!`;
            document.getElementById('ov-btn').textContent  = isLast ? '🔄 Zagraj ponownie' : 'Następny poziom →';
        }

        spawnConfetti();
        document.getElementById('overlay').classList.add('show');
    } else {
        loadWord();
    }
}

function advanceLevel() {
    document.getElementById('overlay').classList.remove('show');
    level   = level >= ACTIVE_LEVELS.length - 1 ? 0 : level + 1;
    wordIdx = 0;
    selectLevelWords(level);
    loadWord();
}

/* ─────────────── Load word ─────────────── */
function loadWord() {
    const { word, emoji, hint } = currentLevelWords[wordIdx];

    // Progress bar
    document.getElementById('level-label').textContent = lang === 'en'
        ? `Level ${level + 1} • ${word.length}-letter words`
        : `Poziom ${level + 1} • słowa ${word.length}-literowe`;

    const dotsEl = document.getElementById('level-dots');
    dotsEl.innerHTML = '';
    currentLevelWords.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'dot' +
            (i < wordIdx ? ' done' : '') +
            (i === wordIdx ? ' active' : '');
        dotsEl.appendChild(d);
    });

    // Emoji
    const emojiEl = document.getElementById('emoji-area');
    emojiEl.className   = '';
    emojiEl.innerHTML = emoji;
    requestAnimationFrame(() => requestAnimationFrame(() => {
        emojiEl.classList.add('emoji-pop');
    }));

    // Hint
    const hintEl = document.getElementById('word-hint');
    hintEl.textContent = hint;
    hintEl.classList.add('hint-hidden');
    hintStage = 0;
    setHintLabel('hint');

    // Reset state
    pool        = makePool(word);
    boxes       = new Array(word.length).fill(null);
    lockedBoxes = new Set();
    wrongBoxes  = new Set();

    renderAll();
    document.getElementById('check-btn').classList.remove('show');

    // Moduł "Słuchanie" — przeczytaj słowo automatycznie
    if (mode === 'listen' && speechAvailable) {
        setTimeout(speakWord, 350);
    }
}

/* ─────────────── Wymowa (Web Speech API) ─────────────── */
const speechAvailable = 'speechSynthesis' in window;

// Wybór głosu kobiecego dopasowanego do języka
let preferredVoice = null;
function pickVoice() {
    if (!speechAvailable) return;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang === 'en' ? 'en' : 'pl';
    const candidates = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
    // nazwy typowych głosów kobiecych (PL + EN, różne przeglądarki/systemy)
    const femaleHints = ['female', 'kobie', 'zosia', 'paulina', 'ewa', 'agnieszka', 'maja',
        'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'tessa', 'fiona',
        'google uk english female', 'google polski'];
    preferredVoice =
        candidates.find(v => femaleHints.some(h => v.name.toLowerCase().includes(h))) ||
        candidates[0] || null;
}
if (speechAvailable) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;   // głosy często ładują się asynchronicznie
}

// Czytanie dowolnego tekstu głosem kobiecym
function speak(text) {
    if (!speechAvailable || !text) return;
    try {
        window.speechSynthesis.cancel();                 // przerwij poprzednie czytanie
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'en' ? 'en-US' : 'pl-PL';
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate  = 0.95;
        utterance.pitch = 1.1;                           // delikatnie wyżej — bardziej kobieco
        window.speechSynthesis.speak(utterance);
    } catch (e) { /* brak syntezy mowy — ignoruj */ }
}

function speakWord() {
    const entry = currentLevelWords[wordIdx];
    if (!entry || !entry.word) return;
    // czytaj w języku interfejsu — zestaw słów jest dobrany do języka
    speak(String(entry.word).replace(/\s*\/\s*/g, ', '));
}

/* ─────────────── Hint (dwustopniowa) ─────────────── */
const HINT_LABELS = {
    pl: { hint: '💡 Podpowiedź', hide: '🙈 Ukryj', show: '👁 Pokaż' },
    en: { hint: '💡 Hint',       hide: '🙈 Hide',  show: '👁 Show'  },
};

function setHintLabel(key) {
    document.getElementById('hint-btn').textContent = HINT_LABELS[lang === 'en' ? 'en' : 'pl'][key];
}

// 1. klik — usuń z puli litery niepasujące do słowa
function applyHintFilter() {
    boxes.forEach((box, i) => {
        if (!box) return;
        const item = pool.find(p => p.id === box.poolId);
        if (item && item.extra) {           // wyjmij błędną literę z kratki
            item.used = false;
            boxes[i] = null;
            wrongBoxes.delete(i);
        }
    });
    pool.forEach(p => { if (p.extra) p.hidden = true; });
    renderAll();
}

function toggleHint() {
    const hintEl = document.getElementById('word-hint');

    if (hintStage === 0) {
        // 1. klik: usuń nieprawidłowe litery z puli
        applyHintFilter();
        hintStage = 1;
        setHintLabel('hint');           // dalej można poprosić o pełną podpowiedź
    } else if (hintStage === 1) {
        // 2. klik: pokaż słowo małymi literami
        hintEl.classList.remove('hint-hidden');
        hintStage = 2;
        setHintLabel('hide');
    } else {
        // kolejne kliknięcia: chowaj / pokazuj słowo
        const hidden = hintEl.classList.toggle('hint-hidden');
        setHintLabel(hidden ? 'show' : 'hide');
    }
}

/* ─────────────── Confetti ─────────────── */
function spawnConfetti() {
    const items = shuffle(CONFETTI);
    for (let i = 0; i < 18; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.textContent = items[i % items.length];
            el.style.left = (5 + Math.random() * 90) + 'vw';
            el.style.top  = '-40px';
            el.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2500);
        }, i * 65);
    }
}

/* ─────────────── Keyboard input ─────────────── */
document.addEventListener('keydown', e => {
    // Ignore when overlay is open
    if (document.getElementById('overlay').classList.contains('show')) return;

    if (e.key === 'Backspace') {
        e.preventDefault();
        // Remove the last filled, non-locked box
        for (let i = boxes.length - 1; i >= 0; i--) {
            if (boxes[i] !== null && !lockedBoxes.has(i)) {
                removeBoxLetter(i);
                break;
            }
        }
        return;
    }

    if (e.key === 'Enter') {
        const btn = document.getElementById('check-btn');
        if (btn.classList.contains('show')) checkAnswer();
        return;
    }

    // Letter key: find matching unused pool item
    const letter = e.key.toUpperCase();
    if (letter.length !== 1) return;
    const item = pool.find(p => !p.used && p.letter === letter);
    if (item) addLetter(item.id);
});

/* ─────────────── Init ─────────────── */
selectLevelWords(level);
loadWord();
