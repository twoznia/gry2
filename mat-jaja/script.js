        const lang = localStorage.getItem('lang') || 'pl';

        const TRANSLATIONS = {
            pl: {
                ageBtn: ['Poziom: 6 lat', 'Poziom: 10 lat', 'Poziom: 14 lat', 'Poziom: Dorosły'],
                opBtn: ['Dodawanie (+)', 'Odejmowanie (−)', 'Mnożenie (×)', 'Dzielenie (÷)', '🎲 Losowo'],
                chooseLevel: 'Wybierz poziom',
                chooseOp: 'Wybierz działanie',
                back: '← Powrót',
                menu: 'Menu',
                gameTitle: '🥚 Matematyczne Jajka 🥚',
                win: 'ZWYCIĘSTWO! 🏆',
                lose: 'KONIEC GRY 💔',
                sessionEnd: 'SESJA ZAKOŃCZONA!',
                finalScore: (p) => `Wynik końcowy: ${p}`,
                correct: (p) => `✅ Poprawne: ${p}`,
                wrong: (p) => `❌ Błędne: ${p}`,
                tapContinue: 'Dotknij przycisk, aby kontynuować',
                menuBtn: '← Menu',
                retryBtn: 'Ponów ↺'
            },
            en: {
                ageBtn: ['Level: age 6', 'Level: age 10', 'Level: age 14', 'Level: Adult'],
                opBtn: ['Addition (+)', 'Subtraction (−)', 'Multiplication (×)', 'Division (÷)', '🎲 Random'],
                chooseLevel: 'Choose level',
                chooseOp: 'Choose operation',
                back: '← Back',
                menu: 'Menu',
                gameTitle: '🥚 Math Eggs 🥚',
                win: 'VICTORY! 🏆',
                lose: 'GAME OVER 💔',
                sessionEnd: 'SESSION ENDED!',
                finalScore: (p) => `Final score: ${p}`,
                correct: (p) => `✅ Correct: ${p}`,
                wrong: (p) => `❌ Wrong: ${p}`,
                tapContinue: 'Tap a button to continue',
                menuBtn: '← Menu',
                retryBtn: 'Retry ↺'
            }
        };
        const t = TRANSLATIONS[lang];

        function setLang(l) {
            localStorage.setItem('lang', l);
            location.reload();
        }

        function highlightLangBtns() {
            document.getElementById('btn-pl').style.borderColor = lang === 'pl' ? '#fff' : '#888';
            document.getElementById('btn-en').style.borderColor = lang === 'en' ? '#fff' : '#888';
        }
        highlightLangBtns();
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        let W, H;

        function resize() {
            const oldW = W || window.innerWidth;
            const oldH = H || window.innerHeight;
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            if (!bgStars.length) {
                bgStars = Array.from({length:50}, () => ({x:Math.random()*W, y:Math.random()*H*0.9, r:Math.random()*2+0.5, a:Math.random()}));
            } else {
                bgStars.forEach(s => { s.x = s.x * W/oldW; s.y = s.y * H/oldH; });
            }
            chmury = [{x:W*0.1,y:H*0.1,r:0.3},{x:W*0.5,y:H*0.065,r:0.5},{x:W*0.8,y:H*0.13,r:0.4}];
            koszykX = W/2;
        }
        window.addEventListener('resize', resize);

        let punkty = 0, poprawne = 0, bledne = 0, ruchy = 20;
        let koszykX = 0, jajkaY = -50, predkosc = 3;
        let menuEtap = "wiek";
        let wybranyWiek = 10, wybranyTryb = "losowo";
        let zadanie = "", poprawnyWynik = 0, opcje = [];
        let gwiazdki = [], lastFeedback = null, feedbackTimer = 0;
        let chmury = [];
        let bgStars = [];

        const przyciskiWiek = [
            { id: 6, txt: t.ageBtn[0], color: "#27ae60" },
            { id: 10, txt: t.ageBtn[1], color: "#2980b9" },
            { id: 14, txt: t.ageBtn[2], color: "#d4ac0d" },
            { id: 99, txt: t.ageBtn[3], color: "#c0392b" }
        ];
        let przyciskiOperacja = [];

        function r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function generujZadanie() {
            let tryb = wybranyTryb;
            if (tryb === "losowo") {
                let mozliwosci = ["dodawanie", "odejmowanie"];
                if (wybranyWiek >= 10) mozliwosci.push("mnożenie", "dzielenie");
                tryb = mozliwosci[Math.floor(Math.random() * mozliwosci.length)];
            }
            let a, b, wynik, symbol;
            const w = wybranyWiek;

            if (tryb === "dodawanie") {
                symbol = "+";
                if (w == 6) { a = r(1, 9); b = r(1, 9); }
                else if (w == 10) { a = r(10, 70); b = r(10, 99-a); }
                else if (w == 14) { a = r(50, 400); b = r(50, 500-a); }
                else { a = r(100, 800); b = r(100, 1000-a); }
                wynik = a + b;
            } else if (tryb === "odejmowanie") {
                symbol = "-";
                if (w == 6) { b = r(1, 9); wynik = r(2, 18); a = b + wynik; }
                else if (w == 10) { a = r(30, 100); b = r(10, a-5); }
                else if (w == 14) { a = r(100, 500); b = r(50, a-20); }
                else { a = r(400, 1000); b = r(100, a-50); }
                wynik = a - b;
            } else if (tryb === "mnożenie") {
                symbol = "×";
                if (w == 10) { a = r(2, 10); b = r(2, 10); }
                else if (w == 14) { a = r(5, 18); b = r(3, 15); }
                else { a = r(10, 32); b = r(5, 28); }
                wynik = a * b;
            } else if (tryb === "dzielenie") {
                symbol = "÷";
                if (w == 10) { wynik = r(2, 10); b = r(2, 10); }
                else if (w == 14) { wynik = r(5, 15); b = r(3, 12); }
                else { wynik = r(10, 35); b = r(5, 20); }
                a = wynik * b;
            }

            zadanie = `${a} ${symbol} ${b} = ?`;
            poprawnyWynik = wynik;
            opcje = [wynik];
            let off = (w == 6) ? 3 : (w == 10 ? 7 : 12);
            while (opcje.length < 3) {
                let f = wynik + (r(1, off*2) - off);
                if (!opcje.includes(f) && f >= 0) opcje.push(f);
            }
            opcje.sort(() => Math.random() - 0.5);
        }

        function wiekBtnRect(i) {
            return { x: W*0.15, y: H*0.33 + i * H*0.13, w: W*0.7, h: H*0.1 };
        }
        function opBtnRect(i) {
            return { x: W*0.15, y: H*0.28 + i * H*0.11, w: W*0.7, h: H*0.085 };
        }

        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        }

        function handleDown(e) {
            const {x: mX, y: mY} = getCoords(e);
            if (menuEtap === "wiek") {
                przyciskiWiek.forEach((btn, i) => {
                    const r = wiekBtnRect(i);
                    if (mX > r.x && mX < r.x+r.w && mY > r.y && mY < r.y+r.h) {
                        wybranyWiek = btn.id;
                        ustawPrzyciskiOperacji();
                        menuEtap = "operacja";
                    }
                });
            } else if (menuEtap === "operacja") {
                if (mX > 20 && mX < 160 && mY > 16 && mY < 58) menuEtap = "wiek";
                przyciskiOperacja.forEach((btn, i) => {
                    const r = opBtnRect(i);
                    if (mX > r.x && mX < r.x+r.w && mY > r.y && mY < r.y+r.h) {
                        wybranyTryb = btn.id;
                        resetGry();
                        menuEtap = "gra";
                    }
                });
            } else if (menuEtap === "gra") {
                if (mX > W-148 && mX < W-20 && mY > 14 && mY < 56) menuEtap = "wiek";
            } else if (menuEtap === "koniec") {
                const btnW = W*0.35, btnH = H*0.09, btnY = H*0.83;
                if (mX > W*0.1 && mX < W*0.1+btnW && mY > btnY && mY < btnY+btnH) menuEtap = "wiek";
                else if (mX > W*0.55 && mX < W*0.55+btnW && mY > btnY && mY < btnY+btnH) { resetGry(); menuEtap = "gra"; }
            }
        }

        function handleMove(e) {
            if (menuEtap !== "gra") return;
            e.preventDefault();
            koszykX = getCoords(e).x;
        }

        canvas.addEventListener("mousedown", handleDown);
        canvas.addEventListener("touchstart", handleDown, {passive: true});
        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("touchmove", handleMove, {passive: false});

        function ustawPrzyciskiOperacji() {
            przyciskiOperacja = [
                { id: "dodawanie",  txt: t.opBtn[0] },
                { id: "odejmowanie", txt: t.opBtn[1] }
            ];
            if (wybranyWiek >= 10) {
                przyciskiOperacja.push({ id: "mnożenie",  txt: t.opBtn[2] });
                przyciskiOperacja.push({ id: "dzielenie", txt: t.opBtn[3] });
            }
            przyciskiOperacja.push({ id: "losowo", txt: t.opBtn[4] });
        }

        function resetGry() {
            punkty = 0; poprawne = 0; bledne = 0; ruchy = 20;
            predkosc = (wybranyWiek === 6 ? 1 : 3) * H/600; jajkaY = -50; koszykX = W/2; gwiazdki = []; generujZadanie();
        }

        function spawnGwiazdki(x, y, ok) {
            for (let i = 0; i < 14; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                gwiazdki.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 1,
                    color: ok ? `hsl(${r(90,150)},90%,55%)` : `hsl(${r(0,20)},90%,55%)`
                });
            }
        }

        function updateGwiazdki() {
            gwiazdki = gwiazdki.filter(g => g.life > 0);
            gwiazdki.forEach(g => { g.x += g.vx; g.y += g.vy; g.vy += 0.2; g.life -= 0.035; });
        }

        function update() {
            if (menuEtap !== "gra") return;
            jajkaY += predkosc;
            if (feedbackTimer > 0) feedbackTimer--;
            const catchTop = H * 0.85, catchBot = H * 0.967;
            const eggXs = [W/4, W/2, 3*W/4];
            const catchRange = W * 0.094;
            if (jajkaY > catchTop && jajkaY < catchBot) {
                for (let i = 0; i < 3; i++) {
                    if (Math.abs(koszykX - eggXs[i]) < catchRange) {
                        const ok = opcje[i] === poprawnyWynik;
                        if (ok) { punkty++; poprawne++; predkosc += (wybranyWiek === 6 ? 0.05 : 0.15) * H/600; }
                        else { punkty--; bledne++; }
                        spawnGwiazdki(eggXs[i], H * 0.883, ok);
                        lastFeedback = ok ? "✓" : "✗";
                        feedbackTimer = 45;
                        ruchy--;
                        jajkaY = -50; generujZadanie(); break;
                    }
                }
            }
            if (jajkaY > H) {
                bledne++; punkty--; ruchy--;
                lastFeedback = "✗"; feedbackTimer = 45;
                jajkaY = -50; generujZadanie();
            }
            updateGwiazdki();
            if (ruchy <= 0 || punkty >= 20 || punkty <= -5) menuEtap = "koniec";
        }

        /* ---- drawing helpers ---- */
        function skyGradient() {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "#0d1b3e");
            g.addColorStop(1, "#1a4a6e");
            return g;
        }

        function drawBgStars() {
            bgStars.forEach(s => {
                s.a += 0.01;
                const alpha = 0.4 + 0.4 * Math.abs(Math.sin(s.a));
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
            });
        }

        function drawCloud(cx, cy, scale) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            [[0,0,40],[30,-10,30],[-30,-8,32],[55,5,28],[-55,5,25]].forEach(([x,y,rad]) => {
                ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI*2); ctx.fill();
            });
            ctx.restore();
        }

        function drawGround() {
            const gy = H * 0.958;
            const g = ctx.createLinearGradient(0, gy, 0, H);
            g.addColorStop(0, "#27ae60");
            g.addColorStop(1, "#1e8449");
            ctx.fillStyle = g;
            ctx.fillRect(0, gy, W, H - gy);
        }

        function drawButton(txt, x, y, w, h, color, fontSize = 21) {
            const shadow = ctx.shadowBlur;
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
            ctx.shadowBlur = shadow; ctx.shadowOffsetY = 0;
            // shine
            const shine = ctx.createLinearGradient(x, y, x, y + h/2);
            shine.addColorStop(0, "rgba(255,255,255,0.18)");
            shine.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = shine;
            ctx.beginPath(); ctx.roundRect(x, y, w, h/2, [12, 12, 0, 0]); ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = `bold ${fontSize}px 'Segoe UI', Arial`;
            ctx.fillText(txt, x + w/2 - ctx.measureText(txt).width/2, y + h/2 + fontSize*0.35);
        }

        const eggPalette = [
            { light: "#ff7675", dark: "#c0392b" },
            { light: "#55efc4", dark: "#00897b" },
            { light: "#ffeaa7", dark: "#e17055" }
        ];

        function drawEgg(x, y, val, highlight, idx) {
            const pal = eggPalette[idx % eggPalette.length];
            // shadow + body
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 22;
            ctx.shadowOffsetY = 10;
            const eg = ctx.createRadialGradient(x - 14, y - 25, 6, x, y - 10, 68);
            eg.addColorStop(0, highlight ? "#ffe066" : pal.light);
            eg.addColorStop(0.6, highlight ? "#f5b942" : pal.light);
            eg.addColorStop(1, highlight ? "#f39c12" : pal.dark);
            ctx.fillStyle = eg;
            ctx.beginPath(); ctx.ellipse(x, y, 60, 72, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            // shine (upper-left only, does not cover number area)
            ctx.fillStyle = "rgba(255,255,255,0.40)";
            ctx.beginPath(); ctx.ellipse(x - 16, y - 28, 18, 22, -0.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            // white oval background behind number for clear readability
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.beginPath(); ctx.ellipse(x, y + 14, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
            // number
            ctx.font = `bold 36px 'Segoe UI', Arial`;
            ctx.textAlign = "center";
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 3;
            ctx.lineJoin = "round";
            ctx.strokeText(val, x, y + 23);
            ctx.fillStyle = "#1a1a2e";
            ctx.fillText(val, x, y + 23);
            ctx.textAlign = "left";
        }

        function drawBasket(bx) {
            const by = H * 0.913;
            const bh = H * 0.05;
            const bw = W * 0.188;
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            const bg = ctx.createLinearGradient(bx-bw/2, by, bx+bw/2, by);
            bg.addColorStop(0, "#6c3483");
            bg.addColorStop(0.5, "#9b59b6");
            bg.addColorStop(1, "#6c3483");
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.roundRect(bx - bw/2, by, bw, bh, [0, 0, 12, 12]); ctx.fill();
            ctx.strokeStyle = "#d7bde2"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(bx - bw/2, by + 4); ctx.lineTo(bx + bw/2, by + 4); ctx.stroke();
            ctx.restore();
        }

        function drawGwiazdki() {
            gwiazdki.forEach(g => {
                ctx.save();
                ctx.globalAlpha = g.life;
                ctx.fillStyle = g.color;
                ctx.beginPath();
                ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        function drawHUD() {
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath(); ctx.roundRect(10, 10, W*0.78, 42, 10); ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 17px 'Segoe UI', Arial";
            ctx.fillText(`⭐ ${punkty}  ✅ ${poprawne}  ❌ ${bledne}  🎯 ${ruchy}`, 22, 37);
            if (feedbackTimer > 0) {
                ctx.save();
                ctx.globalAlpha = feedbackTimer / 45;
                ctx.font = `bold 72px Arial`;
                ctx.fillStyle = lastFeedback === "✓" ? "#2ecc71" : "#e74c3c";
                ctx.textAlign = "center";
                ctx.fillText(lastFeedback, W/2, H/2);
                ctx.textAlign = "left";
                ctx.restore();
            }
        }

        function draw() {
            ctx.fillStyle = skyGradient();
            ctx.fillRect(0, 0, W, H);
            drawBgStars();

            if (menuEtap === "wiek") {
                chmury.forEach(c => { c.x = (c.x + 0.4) % (W + 200); drawCloud(c.x, c.y * 2.5, c.r * 1.5 + 0.7); });
                ctx.fillStyle = "rgba(255,255,255,0.07)";
                ctx.beginPath(); ctx.roundRect(W*0.05, H*0.1, W*0.9, H*0.8, 20); ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = `bold ${Math.min(34, W*0.042)}px 'Segoe UI', Arial`;
                ctx.textAlign = "center";
                ctx.fillText(t.gameTitle, W/2, H*0.22);
                ctx.font = `${Math.min(22, W*0.027)}px 'Segoe UI', Arial`;
                ctx.fillStyle = "#aad4f5";
                ctx.fillText(t.chooseLevel, W/2, H*0.3);
                ctx.textAlign = "left";
                przyciskiWiek.forEach((btn, i) => {
                    const r = wiekBtnRect(i);
                    drawButton(btn.txt, r.x, r.y, r.w, r.h, btn.color, Math.min(21, W*0.026));
                });
            } else if (menuEtap === "operacja") {
                chmury.forEach(c => { c.x = (c.x + 0.4) % (W + 200); drawCloud(c.x, c.y * 2.5, c.r * 1.5 + 0.7); });
                ctx.fillStyle = "rgba(255,255,255,0.07)";
                ctx.beginPath(); ctx.roundRect(W*0.05, H*0.1, W*0.9, H*0.85, 20); ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = `bold ${Math.min(28, W*0.035)}px 'Segoe UI', Arial`;
                ctx.textAlign = "center";
                ctx.fillText(t.chooseOp, W/2, H*0.2);
                ctx.textAlign = "left";
                drawButton(t.back, 20, 16, 140, 42, "#7f8c8d", 17);
                przyciskiOperacja.forEach((btn, i) => {
                    const r = opBtnRect(i);
                    drawButton(btn.txt, r.x, r.y, r.w, r.h, "#2c3e50", Math.min(20, W*0.025));
                });
            } else if (menuEtap === "gra") {
                chmury.forEach(c => { c.x = (c.x + 0.3) % (W + 200); drawCloud(c.x, c.y * 2, c.r + 0.5); });
                drawGround();
                drawHUD();
                drawButton(t.menu, W-148, 14, 128, 42, "#e67e22", 17);
                opcje.forEach((val, i) => drawEgg((i+1)*W/4, jajkaY, val, false, i));
                ctx.fillStyle = "rgba(255,255,255,0.12)";
                ctx.beginPath(); ctx.roundRect(W*0.1, 65, W*0.8, 70, 15); ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = `bold ${Math.min(50, W*0.062)}px 'Segoe UI', Arial`;
                ctx.textAlign = "center";
                ctx.fillText(zadanie, W/2, 120);
                ctx.textAlign = "left";
                drawBasket(koszykX);
                drawGwiazdki();
            } else if (menuEtap === "koniec") {
                const win = punkty >= 20;
                const drawLose = punkty <= -5;
                let msg, endColor;
                if (drawLose) { msg = t.lose; endColor = "#e74c3c"; }
                else if (win) { msg = t.win; endColor = "#2ecc71"; }
                else { msg = t.sessionEnd; endColor = "#f1c40f"; }
                ctx.fillStyle = "rgba(255,255,255,0.08)";
                ctx.beginPath(); ctx.roundRect(W*0.05, H*0.12, W*0.9, H*0.76, 20); ctx.fill();
                ctx.textAlign = "center";
                ctx.font = `bold ${Math.min(52, W*0.065)}px 'Segoe UI', Arial`;
                ctx.fillStyle = endColor;
                ctx.fillText(msg, W/2, H*0.3);
                ctx.font = `${Math.min(26, W*0.032)}px 'Segoe UI', Arial`;
                ctx.fillStyle = "white";
                ctx.fillText(t.finalScore(punkty), W/2, H*0.43);
                ctx.fillText(t.correct(poprawne), W/2, H*0.53);
                ctx.fillText(t.wrong(bledne), W/2, H*0.63);
                ctx.font = `bold ${Math.min(20, W*0.025)}px 'Segoe UI', Arial`;
                ctx.fillStyle = "#aad4f5";
                ctx.fillText(t.tapContinue, W/2, H*0.77);
                ctx.textAlign = "left";
                const btnW = W*0.35, btnH = H*0.09, btnY = H*0.83;
                drawButton(t.menuBtn, W*0.1, btnY, btnW, btnH, "#7f8c8d", Math.min(21, W*0.026));
                drawButton(t.retryBtn, W*0.55, btnY, btnW, btnH, "#2980b9", Math.min(21, W*0.026));
            }
            requestAnimationFrame(draw);
        }

        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
                const rad = Array.isArray(r) ? r[0] : r;
                this.beginPath(); this.moveTo(x + rad, y); this.arcTo(x + w, y, x + w, y + h, rad);
                this.arcTo(x + w, y + h, x, y + h, rad); this.arcTo(x, y + h, x, y, rad);
                this.arcTo(x, y, x + w, y, rad); this.closePath(); return this;
            }
        }
        resize();
        setInterval(update, 1000/60); draw();
    
