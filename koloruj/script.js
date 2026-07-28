// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const hitCanvas = document.createElement('canvas');
const hitCtx    = hitCanvas.getContext('2d', { willReadFrequently: true });

const W = 320, H = 420;
canvas.width    = W;    canvas.height    = H;
hitCanvas.width = W;    hitCanvas.height = H;

const CX = W / 2;      // 160
const CY = 195;        // slightly above centre

// ─── Palette ─────────────────────────────────────────────────────────────────
const COLORS = [
    '#e74c3c','#e67e22','#f1c40f','#2ecc71',
    '#1abc9c','#3498db','#9b59b6','#e91e96',
    '#795548','#ff8fa3','#a8e6cf','#ffffff',
];

let selectedColor = COLORS[0];

function buildPalette() {
    const p = document.getElementById('palette');
    p.innerHTML = '';
    COLORS.forEach(c => {
        const sw = document.createElement('div');
        sw.className = 'swatch' + (c === selectedColor ? ' selected' : '');
        sw.style.background = c;
        if (c === '#ffffff') sw.style.border = '3px solid #d1d5db';
        sw.addEventListener('click', () => {
            document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
            sw.classList.add('selected');
            selectedColor = c;
        });
        p.appendChild(sw);
    });
}

// ─── Zone structure ───────────────────────────────────────────────────────────
// Each zone: { id, path (Path2D), color, defaultColor }
let zones   = [];
let decorFn = null;
let currentAnimal = 'cat';

// ─── CAT ─────────────────────────────────────────────────────────────────────
function makeCatZones() {
    const z = [];

    // Fluffy curled tail (behind body)
    const tail = new Path2D();
    tail.moveTo(48, 70);
    tail.bezierCurveTo(96, 74, 120, 38, 106, 4);
    tail.bezierCurveTo(99, -14, 76, -16, 70, 0);
    tail.bezierCurveTo(66, 12, 78, 19, 87, 11);
    tail.bezierCurveTo(96, 32, 82, 52, 50, 52);
    tail.closePath();
    z.push({ id:'tail', path:tail, color:'#ffffff', defaultColor:'#ffffff' });

    // Pear-shaped sitting body
    const body = new Path2D();
    body.moveTo(0, -20);
    body.bezierCurveTo(42, -20, 68, 8, 68, 42);
    body.bezierCurveTo(68, 82, 42, 104, 0, 104);
    body.bezierCurveTo(-42, 104, -68, 82, -68, 42);
    body.bezierCurveTo(-68, 8, -42, -20, 0, -20);
    body.closePath();
    z.push({ id:'body', path:body, color:'#ffffff', defaultColor:'#ffffff' });

    // Left ear (soft leaf shape)
    const earL = new Path2D();
    earL.moveTo(-12, -82);
    earL.bezierCurveTo(-26, -94, -38, -106, -45, -116);
    earL.bezierCurveTo(-51, -101, -50, -84, -44, -70);
    earL.closePath();
    z.push({ id:'ear_l', path:earL, color:'#ffffff', defaultColor:'#ffffff' });

    // Right ear
    const earR = new Path2D();
    earR.moveTo(12, -82);
    earR.bezierCurveTo(26, -94, 38, -106, 45, -116);
    earR.bezierCurveTo(51, -101, 50, -84, 44, -70);
    earR.closePath();
    z.push({ id:'ear_r', path:earR, color:'#ffffff', defaultColor:'#ffffff' });

    // Rounded head with cheek fluff
    const head = new Path2D();
    head.moveTo(0, -92);
    head.bezierCurveTo(33, -92, 51, -74, 51, -50);
    head.bezierCurveTo(51, -27, 37, -11, 16, -7);
    head.bezierCurveTo(6, -5, -6, -5, -16, -7);
    head.bezierCurveTo(-37, -11, -51, -27, -51, -50);
    head.bezierCurveTo(-51, -74, -33, -92, 0, -92);
    head.closePath();
    z.push({ id:'head', path:head, color:'#ffffff', defaultColor:'#ffffff' });

    // Chest / tummy patch
    const belly = new Path2D();
    belly.moveTo(0, 8);
    belly.bezierCurveTo(23, 8, 35, 30, 35, 52);
    belly.bezierCurveTo(35, 77, 20, 93, 0, 93);
    belly.bezierCurveTo(-20, 93, -35, 77, -35, 52);
    belly.bezierCurveTo(-35, 30, -23, 8, 0, 8);
    belly.closePath();
    z.push({ id:'belly', path:belly, color:'#ffffff', defaultColor:'#ffffff' });

    // Inner ears (colourable) — drawn over the outer ears
    const inL = new Path2D();
    inL.moveTo(-18, -82);
    inL.bezierCurveTo(-27, -91, -35, -100, -40, -108);
    inL.bezierCurveTo(-44, -98, -43, -86, -39, -76);
    inL.closePath();
    z.push({ id:'ear_in_l', path:inL, color:'#ffffff', defaultColor:'#ffffff' });
    const inR = new Path2D();
    inR.moveTo(18, -82);
    inR.bezierCurveTo(27, -91, 35, -100, 40, -108);
    inR.bezierCurveTo(44, -98, 43, -86, 39, -76);
    inR.closePath();
    z.push({ id:'ear_in_r', path:inR, color:'#ffffff', defaultColor:'#ffffff' });

    // Front paws (colourable)
    const pawL = new Path2D();
    pawL.ellipse(-25, 96, 20, 12, 0, 0, Math.PI*2);
    z.push({ id:'paw_l', path:pawL, color:'#ffffff', defaultColor:'#ffffff' });
    const pawR = new Path2D();
    pawR.ellipse(25, 96, 20, 12, 0, 0, Math.PI*2);
    z.push({ id:'paw_r', path:pawR, color:'#ffffff', defaultColor:'#ffffff' });

    return z;
}

function drawCatDecor(c) {
    // Big cute eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.ellipse(-19, -52, 9, 12, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(19, -52, 9, 12, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-15, -57, 3.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(23, -57, 3.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(-21, -48, 1.8, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(17, -48, 1.8, 0, Math.PI*2); c.fill();

    // Heart-shaped nose
    c.fillStyle = '#2c2c2c';
    c.beginPath();
    c.moveTo(0, -27);
    c.bezierCurveTo(-7, -36, -8, -29, -3.5, -30);
    c.bezierCurveTo(-1.5, -30, 0, -29, 0, -27);
    c.bezierCurveTo(0, -29, 1.5, -30, 3.5, -30);
    c.bezierCurveTo(8, -29, 7, -36, 0, -27);
    c.closePath(); c.fill();

    // Smiley mouth
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, -27); c.lineTo(0, -21);
    c.moveTo(0, -21); c.quadraticCurveTo(-8, -16, -13, -19);
    c.moveTo(0, -21); c.quadraticCurveTo(8, -16, 13, -19);
    c.stroke();

    // Whiskers
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.5;
    [[-44,-36],[-46,-29],[-44,-22]].forEach(([ex,ey],i) => {
        c.beginPath(); c.moveTo(-14,-29+i*3); c.quadraticCurveTo((ex-14)/2-4, ey, ex, ey); c.stroke();
    });
    [[44,-36],[46,-29],[44,-22]].forEach(([ex,ey],i) => {
        c.beginPath(); c.moveTo(14,-29+i*3); c.quadraticCurveTo((ex+14)/2+4, ey, ex, ey); c.stroke();
    });

    // Toe lines on the (colourable) paws
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.2;
    [-25,25].forEach(px => {
        c.beginPath(); c.moveTo(px-7,92); c.lineTo(px-7,101); c.stroke();
        c.beginPath(); c.moveTo(px,91);   c.lineTo(px,102);   c.stroke();
        c.beginPath(); c.moveTo(px+7,92); c.lineTo(px+7,101); c.stroke();
    });
}

// ─── DOG ─────────────────────────────────────────────────────────────────────
function makeDogZones() {
    const z = [];

    // Waggy tail (behind body)
    const tail = new Path2D();
    tail.moveTo(54, 54);
    tail.bezierCurveTo(92, 48, 112, 16, 100, -14);
    tail.bezierCurveTo(93, -30, 73, -28, 69, -12);
    tail.bezierCurveTo(66, 0, 77, 7, 84, 0);
    tail.bezierCurveTo(91, 20, 77, 40, 52, 42);
    tail.closePath();
    z.push({ id:'tail', path:tail, color:'#ffffff', defaultColor:'#ffffff' });

    // Round body
    const body = new Path2D();
    body.moveTo(0, -16);
    body.bezierCurveTo(44, -16, 70, 12, 70, 46);
    body.bezierCurveTo(70, 84, 44, 104, 0, 104);
    body.bezierCurveTo(-44, 104, -70, 84, -70, 46);
    body.bezierCurveTo(-70, 12, -44, -16, 0, -16);
    body.closePath();
    z.push({ id:'body', path:body, color:'#ffffff', defaultColor:'#ffffff' });

    // Left floppy ear
    const earL = new Path2D();
    earL.moveTo(-30, -70);
    earL.bezierCurveTo(-62, -74, -80, -42, -74, -6);
    earL.bezierCurveTo(-70, 14, -48, 18, -38, 2);
    earL.bezierCurveTo(-32, -8, -30, -40, -30, -70);
    earL.closePath();
    z.push({ id:'ear_l', path:earL, color:'#ffffff', defaultColor:'#ffffff' });

    // Right floppy ear
    const earR = new Path2D();
    earR.moveTo(30, -70);
    earR.bezierCurveTo(62, -74, 80, -42, 74, -6);
    earR.bezierCurveTo(70, 14, 48, 18, 38, 2);
    earR.bezierCurveTo(32, -8, 30, -40, 30, -70);
    earR.closePath();
    z.push({ id:'ear_r', path:earR, color:'#ffffff', defaultColor:'#ffffff' });

    // Head
    const head = new Path2D();
    head.ellipse(0, -46, 45, 41, 0, 0, Math.PI*2);
    z.push({ id:'head', path:head, color:'#ffffff', defaultColor:'#ffffff' });

    // Rounded muzzle
    const snout = new Path2D();
    snout.moveTo(0, -44);
    snout.bezierCurveTo(23, -44, 31, -29, 28, -16);
    snout.bezierCurveTo(25, -3, 13, 2, 0, 2);
    snout.bezierCurveTo(-13, 2, -25, -3, -28, -16);
    snout.bezierCurveTo(-31, -29, -23, -44, 0, -44);
    snout.closePath();
    z.push({ id:'snout', path:snout, color:'#ffffff', defaultColor:'#ffffff' });

    // Chest patch
    const belly = new Path2D();
    belly.moveTo(0, 16);
    belly.bezierCurveTo(24, 16, 36, 38, 36, 60);
    belly.bezierCurveTo(36, 84, 20, 98, 0, 98);
    belly.bezierCurveTo(-20, 98, -36, 84, -36, 60);
    belly.bezierCurveTo(-36, 38, -24, 16, 0, 16);
    belly.closePath();
    z.push({ id:'belly', path:belly, color:'#ffffff', defaultColor:'#ffffff' });

    // Tongue (colourable) — hangs below the snout
    const tongue = new Path2D();
    tongue.ellipse(0, -2, 8, 11, 0, 0, Math.PI*2);
    z.push({ id:'tongue', path:tongue, color:'#ffffff', defaultColor:'#ffffff' });

    // Front paws (colourable)
    const pawL = new Path2D();
    pawL.ellipse(-27, 98, 22, 13, 0, 0, Math.PI*2);
    z.push({ id:'paw_l', path:pawL, color:'#ffffff', defaultColor:'#ffffff' });
    const pawR = new Path2D();
    pawR.ellipse(27, 98, 22, 13, 0, 0, Math.PI*2);
    z.push({ id:'paw_r', path:pawR, color:'#ffffff', defaultColor:'#ffffff' });

    return z;
}

function drawDogDecor(c) {
    // Eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.ellipse(-17, -52, 8, 10, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(17, -52, 8, 10, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-14, -56, 3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(20, -56, 3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(-19, -48, 1.6, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(15, -48, 1.6, 0, Math.PI*2); c.fill();

    // Nose (dark) on the muzzle
    c.fillStyle = '#2c2c2c';
    c.beginPath(); c.ellipse(0, -32, 12, 9, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.arc(-4, -35, 2.2, 0, Math.PI*2); c.fill();

    // Mouth + smile
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, -24); c.lineTo(0, -14);
    c.moveTo(0, -14); c.quadraticCurveTo(-12, -8, -18, -13);
    c.moveTo(0, -14); c.quadraticCurveTo(12, -8, 18, -13);
    c.stroke();

    // Tongue centre crease (tongue itself is a colourable zone)
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 6); c.stroke();

    // Toe lines on the (colourable) paws
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.2;
    [-27,27].forEach(px => {
        c.beginPath(); c.moveTo(px-8,94); c.lineTo(px-8,103); c.stroke();
        c.beginPath(); c.moveTo(px,93);   c.lineTo(px,104);   c.stroke();
        c.beginPath(); c.moveTo(px+8,94); c.lineTo(px+8,103); c.stroke();
    });
}

// ─── PARROT ──────────────────────────────────────────────────────────────────
function makeParrotZones() {
    const z = [];

    // Pointed tail feathers (behind body)
    const tail = new Path2D();
    tail.moveTo(-18, 84);
    tail.bezierCurveTo(-26, 110, -30, 134, -18, 150);
    tail.lineTo(-8, 126);
    tail.lineTo(0, 152);
    tail.lineTo(8, 126);
    tail.lineTo(18, 150);
    tail.bezierCurveTo(30, 134, 26, 110, 18, 84);
    tail.closePath();
    z.push({ id:'tail', path:tail, color:'#ffffff', defaultColor:'#ffffff' });

    // Body (egg shape)
    const body = new Path2D();
    body.moveTo(0, -18);
    body.bezierCurveTo(40, -18, 54, 14, 52, 50);
    body.bezierCurveTo(50, 86, 28, 106, 0, 106);
    body.bezierCurveTo(-28, 106, -50, 86, -52, 50);
    body.bezierCurveTo(-54, 14, -40, -18, 0, -18);
    body.closePath();
    z.push({ id:'body', path:body, color:'#ffffff', defaultColor:'#ffffff' });

    // Left wing with scalloped feather edge (on the body)
    const wingL = new Path2D();
    wingL.moveTo(-28, -6);
    wingL.bezierCurveTo(-52, -2, -62, 28, -54, 58);
    wingL.bezierCurveTo(-50, 74, -34, 78, -24, 66);
    wingL.bezierCurveTo(-30, 62, -22, 58, -28, 52);
    wingL.bezierCurveTo(-21, 49, -27, 43, -31, 40);
    wingL.bezierCurveTo(-23, 38, -28, 28, -32, 25);
    wingL.bezierCurveTo(-24, 22, -28, 6, -28, -6);
    wingL.closePath();
    z.push({ id:'wing_l', path:wingL, color:'#ffffff', defaultColor:'#ffffff' });

    // Right wing (mirror)
    const wingR = new Path2D();
    wingR.moveTo(28, -6);
    wingR.bezierCurveTo(52, -2, 62, 28, 54, 58);
    wingR.bezierCurveTo(50, 74, 34, 78, 24, 66);
    wingR.bezierCurveTo(30, 62, 22, 58, 28, 52);
    wingR.bezierCurveTo(21, 49, 27, 43, 31, 40);
    wingR.bezierCurveTo(23, 38, 28, 28, 32, 25);
    wingR.bezierCurveTo(24, 22, 28, 6, 28, -6);
    wingR.closePath();
    z.push({ id:'wing_r', path:wingR, color:'#ffffff', defaultColor:'#ffffff' });

    // Crest feathers (behind head)
    const crest = new Path2D();
    crest.moveTo(-18, -78);
    crest.bezierCurveTo(-26, -98, -22, -110, -12, -106);
    crest.bezierCurveTo(-14, -96, -8, -96, -7, -104);
    crest.bezierCurveTo(-4, -118, 4, -118, 7, -104);
    crest.bezierCurveTo(8, -96, 14, -96, 12, -106);
    crest.bezierCurveTo(22, -110, 26, -98, 18, -78);
    crest.closePath();
    z.push({ id:'crest', path:crest, color:'#ffffff', defaultColor:'#ffffff' });

    // Head
    const head = new Path2D();
    head.ellipse(0, -52, 38, 35, 0, 0, Math.PI*2);
    z.push({ id:'head', path:head, color:'#ffffff', defaultColor:'#ffffff' });

    // Cheek patches (one under each eye)
    const cheekL = new Path2D();
    cheekL.ellipse(-19, -39, 12, 10, -0.2, 0, Math.PI*2);
    z.push({ id:'cheek_l', path:cheekL, color:'#ffffff', defaultColor:'#ffffff' });
    const cheekR = new Path2D();
    cheekR.ellipse(19, -39, 12, 10, 0.2, 0, Math.PI*2);
    z.push({ id:'cheek_r', path:cheekR, color:'#ffffff', defaultColor:'#ffffff' });

    // Hooked beak (colourable) — on top of the face
    const beak = new Path2D();
    beak.moveTo(-11, -49);
    beak.bezierCurveTo(-13, -34, -7, -23, 0, -22);
    beak.bezierCurveTo(7, -23, 13, -34, 11, -49);
    beak.bezierCurveTo(5, -54, -5, -54, -11, -49);
    beak.closePath();
    z.push({ id:'beak', path:beak, color:'#ffffff', defaultColor:'#ffffff' });

    // Perch / branch (colourable)
    const perch = new Path2D();
    perch.moveTo(-44, 96); perch.lineTo(58, 96);
    perch.lineTo(58, 107); perch.lineTo(-44, 107);
    perch.closePath();
    z.push({ id:'perch', path:perch, color:'#ffffff', defaultColor:'#ffffff' });

    return z;
}

function drawParrotDecor(c) {
    // Two eyes (symmetric)
    [-17, 17].forEach(ex => {
        c.strokeStyle = '#2c2c2c'; c.lineWidth = 2;
        c.beginPath(); c.arc(ex, -57, 9.5, 0, Math.PI*2); c.stroke();
        c.fillStyle = '#1c1c2e';
        c.beginPath(); c.arc(ex, -57, 5.5, 0, Math.PI*2); c.fill();
        c.fillStyle = 'white';
        c.beginPath(); c.arc(ex + 2.4, -60, 2.4, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(ex - 2.6, -54, 1.3, 0, Math.PI*2); c.fill();
    });

    // Beak crease + nostrils (beak itself is a colourable zone)
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-9, -38); c.quadraticCurveTo(0, -32, 9, -38);
    c.stroke();
    c.fillStyle = '#9a9a9a';
    c.beginPath(); c.arc(-3.5, -46, 1.3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(3.5, -46, 1.3, 0, Math.PI*2); c.fill();

    // Wood grain on the (colourable) perch
    c.strokeStyle = '#bdbdbd'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-38, 101); c.lineTo(52, 101); c.stroke();

    // Feet gripping the perch
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 3.5; c.lineCap = 'round';
    [-10, 18].forEach(ox => {
        c.beginPath(); c.moveTo(ox, 92); c.lineTo(ox, 96); c.stroke();
        c.beginPath(); c.moveTo(ox, 96); c.lineTo(ox-7, 90); c.stroke();
        c.beginPath(); c.moveTo(ox, 96); c.lineTo(ox, 90); c.stroke();
        c.beginPath(); c.moveTo(ox, 96); c.lineTo(ox+7, 90); c.stroke();
    });
}

// ─── Shape helpers ─────────────────────────────────────────────────────────────
function zone(id, path) { return { id, path, color:'#ffffff', defaultColor:'#ffffff' }; }

// A bumpy "fluffy" closed blob (used for sheep wool).
function fluffyBlob(cx, cy, rx, ry, bumps, bump) {
    const p = new Path2D();
    for (let i = 0; i <= bumps; i++) {
        const a = (i / bumps) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        if (i === 0) { p.moveTo(x, y); }
        else {
            const a0 = ((i - 1) / bumps) * Math.PI * 2 - Math.PI / 2;
            const am = (a0 + a) / 2;
            p.quadraticCurveTo(cx + Math.cos(am) * (rx + bump), cy + Math.sin(am) * (ry + bump), x, y);
        }
    }
    p.closePath();
    return p;
}

// A five-pointed star.
function makeStar(cx, cy, outerR, innerR, points) {
    const p = new Path2D();
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
    }
    p.closePath();
    return p;
}

function bodyColor(fallback) {
    return zones.find(z => z.id === 'body')?.color || fallback || '#ffffff';
}

function ellipseZone(id, x, y, rx, ry, rot) {
    const p = new Path2D();
    p.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    return zone(id, p);
}

// ─── GOAT ──────────────────────────────────────────────────────────────────────
function makeGoatZones() {
    const z = [];

    const body = new Path2D();
    body.moveTo(0, -6);
    body.bezierCurveTo(46, -6, 60, 26, 58, 58);
    body.bezierCurveTo(56, 92, 32, 110, 0, 110);
    body.bezierCurveTo(-32, 110, -56, 92, -58, 58);
    body.bezierCurveTo(-60, 26, -46, -6, 0, -6);
    body.closePath();
    z.push(zone('body', body));

    const earL = new Path2D();
    earL.moveTo(-34, -60); earL.bezierCurveTo(-58, -70, -74, -64, -72, -54);
    earL.bezierCurveTo(-70, -46, -50, -44, -34, -50); earL.closePath();
    z.push(zone('ear_l', earL));
    const earR = new Path2D();
    earR.moveTo(34, -60); earR.bezierCurveTo(58, -70, 74, -64, 72, -54);
    earR.bezierCurveTo(70, -46, 50, -44, 34, -50); earR.closePath();
    z.push(zone('ear_r', earR));

    const hornL = new Path2D();
    hornL.moveTo(-15, -84); hornL.bezierCurveTo(-22, -104, -30, -118, -38, -122);
    hornL.bezierCurveTo(-34, -110, -29, -96, -21, -84); hornL.closePath();
    z.push(zone('horn_l', hornL));
    const hornR = new Path2D();
    hornR.moveTo(15, -84); hornR.bezierCurveTo(22, -104, 30, -118, 38, -122);
    hornR.bezierCurveTo(34, -110, 29, -96, 21, -84); hornR.closePath();
    z.push(zone('horn_r', hornR));

    const head = new Path2D();
    head.moveTo(0, -100);
    head.bezierCurveTo(28, -100, 42, -84, 42, -58);
    head.bezierCurveTo(42, -34, 30, -16, 16, -12);
    head.bezierCurveTo(6, -10, -6, -10, -16, -12);
    head.bezierCurveTo(-30, -16, -42, -34, -42, -58);
    head.bezierCurveTo(-42, -84, -28, -100, 0, -100);
    head.closePath();
    z.push(zone('head', head));

    z.push(ellipseZone('muzzle', 0, -22, 22, 16));
    return z;
}

function drawGoatDecor(c) {
    // Eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.ellipse(-15, -58, 7, 9, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(15, -58, 7, 9, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-12, -62, 2.6, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(18, -62, 2.6, 0, Math.PI*2); c.fill();
    // Nostrils + mouth
    c.fillStyle = '#2c2c2c';
    c.beginPath(); c.ellipse(-7, -24, 2.4, 3, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(7, -24, 2.4, 3, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, -14); c.quadraticCurveTo(0, -8, 8, -14); c.stroke();
    // Beard tuft under chin
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2c2c2c'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-9, -12); c.lineTo(9, -12);
    c.lineTo(6, 4); c.lineTo(2, -4); c.lineTo(-2, 6); c.lineTo(-6, -4); c.closePath();
    c.fill(); c.stroke();
    // Front legs
    const bc = bodyColor();
    c.fillStyle = bc; c.strokeStyle = '#2c2c2c'; c.lineWidth = 2.5;
    [-22, 22].forEach(px => {
        c.beginPath(); c.moveTo(px-9, 96); c.lineTo(px+9, 96);
        c.lineTo(px+9, 118); c.lineTo(px-9, 118); c.closePath(); c.fill(); c.stroke();
    });
}

// ─── HEN ───────────────────────────────────────────────────────────────────────
function makeHenZones() {
    const z = [];

    // Layered tail feathers (behind body)
    const tail = new Path2D();
    tail.moveTo(34, 18);
    tail.bezierCurveTo(66, 12, 86, -8, 90, -36);
    tail.bezierCurveTo(80, -30, 74, -20, 68, -26);
    tail.bezierCurveTo(80, -38, 80, -58, 72, -74);
    tail.bezierCurveTo(62, -60, 58, -40, 54, -28);
    tail.bezierCurveTo(58, -44, 48, -56, 36, -60);
    tail.bezierCurveTo(40, -36, 36, -4, 32, 12);
    tail.closePath();
    z.push(zone('tail', tail));

    // Plump body
    const body = new Path2D();
    body.moveTo(0, -20);
    body.bezierCurveTo(46, -20, 60, 14, 58, 48);
    body.bezierCurveTo(56, 82, 30, 100, 0, 100);
    body.bezierCurveTo(-30, 100, -56, 82, -58, 48);
    body.bezierCurveTo(-60, 14, -46, -20, 0, -20);
    body.closePath();
    z.push(zone('body', body));

    // Wing with scalloped lower edge
    const wing = new Path2D();
    wing.moveTo(-4, 4);
    wing.bezierCurveTo(-40, 0, -54, 26, -48, 50);
    wing.bezierCurveTo(-42, 56, -38, 50, -33, 55);
    wing.bezierCurveTo(-28, 60, -22, 54, -17, 58);
    wing.bezierCurveTo(-11, 60, -6, 52, -3, 46);
    wing.bezierCurveTo(-1, 28, -1, 14, -4, 4);
    wing.closePath();
    z.push(zone('wing', wing));

    // Comb — 3 rounded bumps
    const comb = new Path2D();
    comb.moveTo(-18, -62);
    comb.bezierCurveTo(-22, -82, -8, -84, -8, -68);
    comb.bezierCurveTo(-8, -88, 8, -88, 7, -68);
    comb.bezierCurveTo(8, -90, 22, -84, 17, -62);
    comb.closePath();
    z.push(zone('comb', comb));

    z.push(ellipseZone('head', 0, -46, 28, 27));

    // Wattle (colourable) under the beak
    const wattle = new Path2D();
    wattle.ellipse(0, -24, 5.5, 8, 0, 0, Math.PI*2);
    z.push(zone('wattle', wattle));
    return z;
}

function drawHenDecor(c) {
    // Eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.arc(-9, -50, 4.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(9, -50, 4.5, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-7.5, -52, 1.7, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(10.5, -52, 1.7, 0, Math.PI*2); c.fill();
    // Beak (diamond)
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2c2c2c'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-9, -40); c.lineTo(9, -40); c.lineTo(0, -28); c.closePath();
    c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-9, -40); c.lineTo(9, -40); c.stroke();
    // Wing feather lines
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.4; c.lineCap = 'round';
    [0,1,2].forEach(i => {
        c.beginPath();
        c.moveTo(-8, 16 + i*11);
        c.quadraticCurveTo(-30, 22 + i*11, -42, 40 + i*6);
        c.stroke();
    });
    // Tail feather separators
    c.beginPath(); c.moveTo(40, 2); c.quadraticCurveTo(62, -16, 70, -42); c.stroke();
    c.beginPath(); c.moveTo(44, -16); c.quadraticCurveTo(54, -34, 58, -52); c.stroke();
    // Legs + feet
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 3; c.lineCap = 'round';
    [-15, 15].forEach(px => {
        c.beginPath(); c.moveTo(px, 94); c.lineTo(px, 114); c.stroke();
        c.beginPath(); c.moveTo(px, 114); c.lineTo(px-7, 120); c.stroke();
        c.beginPath(); c.moveTo(px, 114); c.lineTo(px, 121); c.stroke();
        c.beginPath(); c.moveTo(px, 114); c.lineTo(px+7, 120); c.stroke();
    });
}

// ─── HORSE ─────────────────────────────────────────────────────────────────────
function makeHorseZones() {
    const z = [];

    const body = new Path2D();
    body.moveTo(0, -8);
    body.bezierCurveTo(46, -8, 60, 24, 58, 56);
    body.bezierCurveTo(56, 90, 32, 108, 0, 108);
    body.bezierCurveTo(-32, 108, -56, 90, -58, 56);
    body.bezierCurveTo(-60, 24, -46, -8, 0, -8);
    body.closePath();
    z.push(zone('body', body));

    const mane = new Path2D();
    mane.moveTo(-30, -86);
    mane.bezierCurveTo(-44, -70, -46, -40, -40, -12);
    mane.bezierCurveTo(-30, -18, -26, -44, -28, -64);
    mane.bezierCurveTo(-29, -74, -30, -82, -30, -86);
    mane.closePath();
    z.push(zone('mane', mane));

    const earL = new Path2D();
    earL.moveTo(-12, -88); earL.bezierCurveTo(-20, -104, -26, -114, -30, -118);
    earL.bezierCurveTo(-30, -106, -26, -94, -20, -84); earL.closePath();
    z.push(zone('ear_l', earL));
    const earR = new Path2D();
    earR.moveTo(12, -88); earR.bezierCurveTo(20, -104, 26, -114, 30, -118);
    earR.bezierCurveTo(30, -106, 26, -94, 20, -84); earR.closePath();
    z.push(zone('ear_r', earR));

    const head = new Path2D();
    head.moveTo(0, -96);
    head.bezierCurveTo(24, -96, 34, -78, 33, -52);
    head.bezierCurveTo(32, -30, 28, -14, 24, -2);
    head.bezierCurveTo(18, 8, -18, 8, -24, -2);
    head.bezierCurveTo(-28, -14, -32, -30, -33, -52);
    head.bezierCurveTo(-34, -78, -24, -96, 0, -96);
    head.closePath();
    z.push(zone('head', head));

    z.push(ellipseZone('muzzle', 0, -6, 24, 16));
    return z;
}

function drawHorseDecor(c) {
    // Forelock between ears
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2c2c2c'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-10, -92); c.quadraticCurveTo(0, -104, 10, -92);
    c.quadraticCurveTo(6, -82, 0, -78); c.quadraticCurveTo(-6, -82, -10, -92);
    c.closePath(); c.fill(); c.stroke();
    // Eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.ellipse(-15, -56, 6.5, 8.5, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(15, -56, 6.5, 8.5, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-12, -60, 2.4, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(18, -60, 2.4, 0, Math.PI*2); c.fill();
    // Nostrils + mouth
    c.fillStyle = '#2c2c2c';
    c.beginPath(); c.ellipse(-8, -6, 3, 4, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(8, -6, 3, 4, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-9, 3); c.quadraticCurveTo(0, 8, 9, 3); c.stroke();
    // Mane texture strokes (on the mane)
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.6; c.lineCap = 'round';
    [[-37,-66],[-41,-46],[-39,-24]].forEach(([sx,sy]) => {
        c.beginPath(); c.moveTo(sx+5, sy-7); c.quadraticCurveTo(sx-7, sy, sx-3, sy+9); c.stroke();
    });
    // Front legs
    const bc = bodyColor();
    c.fillStyle = bc; c.strokeStyle = '#2c2c2c'; c.lineWidth = 2.5;
    [-22, 22].forEach(px => {
        c.beginPath(); c.moveTo(px-9, 96); c.lineTo(px+9, 96);
        c.lineTo(px+9, 118); c.lineTo(px-9, 118); c.closePath(); c.fill(); c.stroke();
    });
}

// ─── SHEEP ─────────────────────────────────────────────────────────────────────
function makeSheepZones() {
    const z = [];

    // Four legs (colourable) — behind the body
    [-32, -12, 12, 32].forEach((lx, i) => {
        const leg = new Path2D();
        leg.moveTo(lx-7, 80); leg.lineTo(lx+7, 80);
        leg.lineTo(lx+7, 116); leg.lineTo(lx-7, 116); leg.closePath();
        z.push(zone('leg_' + i, leg));
    });

    z.push(zone('body', fluffyBlob(0, 42, 54, 48, 12, 12)));

    // Neck between head and body
    const neck = new Path2D();
    neck.moveTo(-15, -18); neck.lineTo(15, -18);
    neck.lineTo(13, 12); neck.lineTo(-13, 12); neck.closePath();
    z.push(zone('neck', neck));

    z.push(ellipseZone('ear_l', -34, -42, 13, 8, -0.5));
    z.push(ellipseZone('ear_r', 34, -42, 13, 8, 0.5));
    z.push(ellipseZone('head', 0, -46, 30, 30));
    z.push(zone('wool', fluffyBlob(0, -64, 26, 14, 6, 8)));
    return z;
}

function drawSheepDecor(c) {
    // Eyes
    c.fillStyle = '#1c1c2e';
    c.beginPath(); c.arc(-12, -48, 5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(12, -48, 5, 0, Math.PI*2); c.fill();
    c.fillStyle = 'white';
    c.beginPath(); c.arc(-10, -50, 1.8, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(14, -50, 1.8, 0, Math.PI*2); c.fill();
    // Nose + mouth
    c.fillStyle = '#2c2c2c';
    c.beginPath(); c.ellipse(0, -34, 6, 4.5, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -30); c.lineTo(0, -24);
    c.moveTo(0, -24); c.quadraticCurveTo(-7, -20, -11, -23);
    c.moveTo(0, -24); c.quadraticCurveTo(7, -20, 11, -23); c.stroke();
    // Hoof lines on the (colourable) legs
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.4;
    [-32, -12, 12, 32].forEach(lx => {
        c.beginPath(); c.moveTo(lx-7, 108); c.lineTo(lx+7, 108); c.stroke();
    });
}

// ─── HOUSE ─────────────────────────────────────────────────────────────────────
// A picket-fence path: n pointed pickets joined by two rails.
function picketFence(x0, x1, top, bottom, n) {
    const p = new Path2D();
    const w = (x1 - x0) / n, pw = w * 0.6, tip = top - 9;
    for (let i = 0; i < n; i++) {
        const px = x0 + i * w + (w - pw) / 2;
        p.moveTo(px, bottom); p.lineTo(px, top);
        p.lineTo(px + pw / 2, tip); p.lineTo(px + pw, top);
        p.lineTo(px + pw, bottom); p.closePath();
    }
    p.rect(x0, top + 5, x1 - x0, 5);
    p.rect(x0, bottom - 15, x1 - x0, 5);
    return p;
}

function makeHouseZones() {
    const z = [];

    // Picket fences either side (colourable)
    z.push(zone('fence_l', picketFence(-94, -52, 54, 88, 3)));
    z.push(zone('fence_r', picketFence(52, 94, 54, 88, 3)));

    const chimney = new Path2D();
    chimney.rect(26, -46, 16, 30);
    z.push(zone('chimney', chimney));

    const wall = new Path2D();
    wall.rect(-50, 0, 100, 88);
    z.push(zone('wall', wall));

    const roof = new Path2D();
    roof.moveTo(-64, 4); roof.lineTo(0, -58); roof.lineTo(64, 4); roof.closePath();
    z.push(zone('roof', roof));

    const door = new Path2D();
    door.moveTo(-15, 88); door.lineTo(-15, 50);
    door.bezierCurveTo(-15, 38, 15, 38, 15, 50); door.lineTo(15, 88); door.closePath();
    z.push(zone('door', door));

    const winL = new Path2D(); winL.rect(-40, 16, 24, 24);
    z.push(zone('window_l', winL));
    const winR = new Path2D(); winR.rect(16, 16, 24, 24);
    z.push(zone('window_r', winR));
    return z;
}

function drawHouseDecor(c) {
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 2; c.lineCap = 'round';
    // Window mullions
    [[-28,28],[28,28]].forEach(([cx]) => {
        c.beginPath(); c.moveTo(cx, 16); c.lineTo(cx, 40); c.stroke();
        c.beginPath(); c.moveTo(cx-12, 28); c.lineTo(cx+12, 28); c.stroke();
    });
    // Door knob
    c.fillStyle = '#2c2c2c';
    c.beginPath(); c.arc(9, 66, 2.6, 0, Math.PI*2); c.fill();
    // Smoke puffs rising from the chimney
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 2;
    c.fillStyle = 'rgba(255,255,255,0.85)';
    [[36,-54,6],[44,-66,8],[52,-82,10]].forEach(([x,y,r]) => {
        c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill(); c.stroke();
    });
}

// ─── CHRISTMAS TREE ──────────────────────────────────────────────────────────────
function makeTreeZones() {
    const z = [];

    const trunk = new Path2D();
    trunk.rect(-11, 76, 22, 30);
    z.push(zone('trunk', trunk));

    const tierB = new Path2D();
    tierB.moveTo(-60, 82); tierB.lineTo(0, 26); tierB.lineTo(60, 82); tierB.closePath();
    z.push(zone('tier_bottom', tierB));

    const tierM = new Path2D();
    tierM.moveTo(-48, 34); tierM.lineTo(0, -16); tierM.lineTo(48, 34); tierM.closePath();
    z.push(zone('tier_mid', tierM));

    const tierT = new Path2D();
    tierT.moveTo(-36, -8); tierT.lineTo(0, -58); tierT.lineTo(36, -8); tierT.closePath();
    z.push(zone('tier_top', tierT));

    z.push(zone('star', makeStar(0, -68, 17, 7.5, 5)));

    // Baubles (colourable) — bigger ornaments on the tiers
    [[-24,62],[22,66],[0,44],[-18,16],[22,20],[0,-26]].forEach(([x,y],i) => {
        const b = new Path2D();
        b.ellipse(x, y, 9, 9, 0, 0, Math.PI*2);
        z.push(zone('bauble_' + i, b));
    });
    return z;
}

function drawTreeDecor(c) {
    // Little caps + hangers on the (colourable) baubles
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.4; c.lineCap = 'round';
    [[-24,62],[22,66],[0,44],[-18,16],[22,20],[0,-26]].forEach(([x,y]) => {
        c.beginPath(); c.moveTo(x, y-9); c.lineTo(x, y-13); c.stroke();
        c.beginPath(); c.arc(x, y-7, 2, Math.PI, Math.PI*2); c.stroke();
    });
}

// ─── FLOWER ──────────────────────────────────────────────────────────────────────
function makeFlowerZones() {
    const z = [];
    const FCX = 0, FCY = -36;          // flower-head centre

    // Stem
    const stem = new Path2D();
    stem.moveTo(-5, -8);
    stem.bezierCurveTo(-7, 40, -6, 78, -5, 112);
    stem.lineTo(5, 112);
    stem.bezierCurveTo(6, 78, 7, 40, 5, -8);
    stem.closePath();
    z.push(zone('stem', stem));

    // Leaf on the stem
    const leaf = new Path2D();
    leaf.moveTo(-4, 62);
    leaf.bezierCurveTo(-30, 44, -56, 50, -58, 66);
    leaf.bezierCurveTo(-50, 80, -24, 80, -4, 64);
    leaf.closePath();
    z.push(zone('leaf', leaf));

    // 16 petals (each its own colourable zone)
    const N = 16, pr = 36;
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const petal = new Path2D();
        petal.ellipse(FCX + Math.cos(a) * pr, FCY + Math.sin(a) * pr, 16, 7.5, a, 0, Math.PI*2);
        z.push(zone('petal_' + i, petal));
    }

    // Centre circle (on top of the petal tips)
    z.push(ellipseZone('center', FCX, FCY, 23, 23));
    return z;
}

function drawFlowerDecor(c) {
    const FCX = 0, FCY = -36;
    // Seed dots in the centre
    c.fillStyle = '#9a9a9a';
    for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        c.beginPath(); c.arc(FCX + Math.cos(a) * 9, FCY + Math.sin(a) * 9, 2, 0, Math.PI*2); c.fill();
    }
    c.beginPath(); c.arc(FCX, FCY, 2.4, 0, Math.PI*2); c.fill();
    // Leaf vein
    c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, 64); c.quadraticCurveTo(-32, 62, -54, 65); c.stroke();
}

// ─── Animal registry ──────────────────────────────────────────────────────────
// scale + cy are tuned so each subject fills (almost) the whole canvas with a
// small margin. cy is the on-screen y of the subject's local origin.
const ANIMALS = {
    cat:    { makeZones: makeCatZones,    decor: drawCatDecor,    scale: 1.75, cy: 217 },
    dog:    { makeZones: makeDogZones,    decor: drawDogDecor,    scale: 2.05, cy: 172 },
    parrot: { makeZones: makeParrotZones, decor: drawParrotDecor, scale: 1.50, cy: 185 },
    goat:   { makeZones: makeGoatZones,   decor: drawGoatDecor,   scale: 1.72, cy: 220 },
    hen:    { makeZones: makeHenZones,    decor: drawHenDecor,    scale: 1.90, cy: 177 },
    horse:  { makeZones: makeHorseZones,  decor: drawHorseDecor,  scale: 1.77, cy: 219 },
    sheep:  { makeZones: makeSheepZones,  decor: drawSheepDecor,  scale: 1.96, cy: 181 },
    house:  { makeZones: makeHouseZones,  decor: drawHouseDecor,  scale: 1.60, cy: 213 },
    tree:   { makeZones: makeTreeZones,   decor: drawTreeDecor,   scale: 2.05, cy: 186 },
    flower: { makeZones: makeFlowerZones, decor: drawFlowerDecor,  scale: 1.95, cy: 187 },
};

let currentScale = 1, currentCY = CY;

// ─── Draw ─────────────────────────────────────────────────────────────────────
function renderAt(c, offX, offY, angle) {
    c.save();
    c.translate(CX + offX, currentCY + offY);
    if (angle) c.rotate(angle);
    c.scale(currentScale, currentScale);

    // Fill + stroke each zone in z-order so every foreground shape cleanly
    // covers the one behind it — no outlines bleeding through overlaps.
    // Counter-scale the outline so it stays a constant on-screen weight.
    c.strokeStyle = '#2c2c2c';
    c.lineWidth = 3 / currentScale;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    for (const zone of zones) {
        c.fillStyle = zone.color;
        c.fill(zone.path);
        c.stroke(zone.path);
    }

    // Decorations (eyes, nose, etc.)
    if (decorFn) decorFn(c);

    c.restore();
}

function drawHitmap() {
    hitCtx.clearRect(0, 0, W, H);
    hitCtx.save();
    hitCtx.translate(CX, currentCY);
    hitCtx.scale(currentScale, currentScale);
    zones.forEach((zone, idx) => {
        hitCtx.fillStyle = `rgb(${idx + 1},0,0)`;
        hitCtx.fill(zone.path);
    });
    hitCtx.restore();
}

function drawScene() {
    ctx.clearRect(0, 0, W, H);
    // Paper background
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, W, H);
    renderAt(ctx, animX, animY, animAngle);
}

// ─── Animation ───────────────────────────────────────────────────────────────
let animX = 0, animY = 0, animAngle = 0;
let isAnimating = false;
let animState = 'idle';
let animStart = 0;

function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    document.getElementById('done-btn').disabled = true;
    animState = 'bounce';
    animStart = performance.now();
    animX = 0; animY = 0; animAngle = 0;
    requestAnimationFrame(animLoop);
}

function animLoop(now) {
    const t = (now - animStart) / 1000;

    if (animState === 'bounce') {
        // 3 jolly bounces
        animY = -Math.abs(Math.sin(t * Math.PI * 2.5)) * 26;
        animAngle = Math.sin(t * Math.PI * 5) * 0.06;
        if (t > 1.25) {
            animY = 0; animAngle = 0;
            animState = 'exit';
            animStart = now;
        }
    } else if (animState === 'exit') {
        // run/fly off to the right
        const p = Math.min(t / 0.65, 1);
        animX = p * (W + 220);
        // parrot flies (y-oscillate), others run (y-bounce)
        animY = currentAnimal === 'parrot'
            ? Math.sin(t * Math.PI * 10) * 14
            : -Math.abs(Math.sin(t * Math.PI * 7)) * 14;
        animAngle = currentAnimal === 'parrot' ? Math.sin(t * Math.PI * 7) * 0.07 : 0;
        if (p >= 1) {
            animX = -(W + 220);
            animState = 'enter';
            animStart = now;
        }
    } else if (animState === 'enter') {
        // come back from left
        const p = Math.min(t / 0.65, 1);
        animX = -(W + 220) + p * (W + 220);
        animY = currentAnimal === 'parrot'
            ? Math.sin(t * Math.PI * 10) * 14
            : -Math.abs(Math.sin(t * Math.PI * 7)) * 14;
        animAngle = currentAnimal === 'parrot' ? Math.sin(t * Math.PI * 7) * 0.07 : 0;
        if (p >= 1) {
            animX = 0;
            animState = 'settle';
            animStart = now;
        }
    } else if (animState === 'settle') {
        // little wiggle, come to rest
        const decay = Math.max(0, 1 - t / 0.7);
        animY     = -Math.abs(Math.sin(t * Math.PI * 5)) * 12 * decay;
        animAngle = Math.sin(t * Math.PI * 6) * 0.05 * decay;
        if (t > 0.7) {
            animX = 0; animY = 0; animAngle = 0;
            isAnimating = false;
            document.getElementById('done-btn').disabled = false;
            drawScene();
            celebrate();
            return;
        }
    }

    drawScene();
    requestAnimationFrame(animLoop);
}

function celebrate() {
    const msg = document.getElementById('message');
    msg.textContent = '⭐ 🎉 ⭐';
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2200);
}

// ─── Hit testing & painting ───────────────────────────────────────────────────
function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width, sy = H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
        x: Math.round((src.clientX - rect.left) * sx),
        y: Math.round((src.clientY - rect.top)  * sy),
    };
}

function paint(e) {
    if (isAnimating) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const px = hitCtx.getImageData(x, y, 1, 1).data;
    const r  = px[0];
    if (r > 0 && zones[r - 1]) {
        zones[r - 1].color = selectedColor;
        drawScene();
    }
}

canvas.addEventListener('click',      paint);
canvas.addEventListener('touchstart', paint, { passive: false });

// drag-to-paint
let painting = false;
canvas.addEventListener('mousedown',  () => { painting = true; });
canvas.addEventListener('mouseup',    () => { painting = false; });
canvas.addEventListener('mousemove',  e => { if (painting) paint(e); });
canvas.addEventListener('touchmove',  e => { paint(e); }, { passive: false });

// ─── Animal selection ─────────────────────────────────────────────────────────
function selectAnimal(id) {
    currentAnimal = id;
    zones   = ANIMALS[id].makeZones();
    decorFn = ANIMALS[id].decor;
    currentScale = ANIMALS[id].scale;
    currentCY    = ANIMALS[id].cy;
    animX = 0; animY = 0; animAngle = 0;
    isAnimating = false;
    drawHitmap();
    drawScene();
    document.querySelectorAll('.animal-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.animal === id);
    });
}

function clearColors() {
    zones.forEach(z => { z.color = z.defaultColor; });
    drawScene();
}

document.querySelectorAll('.animal-btn').forEach(b => {
    b.addEventListener('click', () => selectAnimal(b.dataset.animal));
});
document.getElementById('done-btn').addEventListener('click', startAnimation);
document.getElementById('clear-btn').addEventListener('click', clearColors);

// ─── Init ─────────────────────────────────────────────────────────────────────
buildPalette();
selectAnimal('cat');
