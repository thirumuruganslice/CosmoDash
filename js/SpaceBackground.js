/* ============================================
   CosmoDash — Pixel Art Space Background
   ES Module — renders into the game canvas
   Stars, nova, asteroids, ships & black hole
   ============================================ */

const PX = 2;

// ── Palette ────────────────────────────────────
const C = {
    bg: "#030310",
    starWhite: "#e8e8ff",
    starBlue: "#88aaff",
    starGold: "#ffd866",
    starDim: "#445588",
    novaCore: "#ff2244",
    novaMid: "#ff6633",
    novaOuter: "#cc1133",
    novaGlow: "#ff4466",
    rock: ["#2a1f14", "#4a3828", "#6b5540", "#8a7058", "#a08868"],
    shipCyan: ["#00aadd", "#0088bb", "#006699", "#ccf4ff"],
    shipRed: ["#dd4422", "#bb2200", "#881800", "#ffccbb"],
    shipGold: ["#ddaa00", "#bb8800", "#886600", "#fff0bb"],
    flame: ["#ffffff", "#66eeff", "#00ccff"],
    flameRed: ["#ffffff", "#ffaa44", "#ff5500"],
    bhGlow: "#6600cc",
    bhRing: ["#ff4400", "#ff7722", "#ffaa44", "#ffdd88"],
};

// ── Helpers ────────────────────────────────────
function px(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
}

function drawShape(ctx, cx, cy, scale, grid, pal) {
    const rows = grid.length, cols = grid[0].length;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const v = grid[r][c];
            if (v > 0 && v <= pal.length)
                px(ctx, cx + (c - cols / 2) * scale, cy + (r - rows / 2) * scale, scale, pal[v - 1]);
        }
}

// ── Pixel art shapes ───────────────────────────
const BIG_STAR = [
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 3, 1, 0, 0, 0],
    [0, 1, 1, 2, 3, 2, 1, 1, 0],
    [1, 2, 3, 3, 4, 3, 3, 2, 1],
    [0, 1, 1, 2, 3, 2, 1, 1, 0],
    [0, 0, 0, 1, 3, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
];
const STAR_PAL_W = ["#6688cc", "#aabbee", "#dde4ff", "#ffffff"];
const STAR_PAL_G = ["#886622", "#ccaa44", "#ffdd66", "#ffffff"];

const AST_SHAPES = [
    [[0, 0, 1, 1, 1, 0, 0], [0, 1, 2, 3, 2, 1, 0], [1, 3, 4, 5, 4, 3, 1], [1, 3, 5, 5, 4, 2, 1], [1, 2, 4, 4, 3, 1, 0], [0, 1, 2, 3, 1, 0, 0], [0, 0, 1, 1, 0, 0, 0]],
    [[0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 1, 2, 3, 2, 1, 0, 0], [0, 1, 3, 4, 5, 4, 3, 1, 0], [1, 2, 4, 5, 5, 5, 4, 2, 0], [1, 3, 5, 5, 5, 4, 3, 2, 1], [1, 2, 4, 5, 4, 3, 2, 1, 0], [0, 1, 3, 4, 3, 2, 1, 0, 0], [0, 0, 1, 2, 2, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], [0, 0, 1, 1, 2, 3, 2, 1, 0, 0, 0], [0, 1, 2, 3, 4, 5, 4, 3, 1, 0, 0], [0, 1, 3, 5, 5, 5, 5, 4, 2, 1, 0], [1, 2, 4, 5, 5, 5, 5, 5, 3, 1, 0], [1, 3, 5, 5, 5, 5, 5, 4, 3, 2, 1], [1, 2, 4, 5, 5, 4, 4, 3, 2, 1, 0], [0, 1, 3, 4, 4, 3, 3, 2, 1, 0, 0], [0, 0, 1, 2, 3, 2, 2, 1, 0, 0, 0], [0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]],
];

const SHIP_GRIDS = [
    { g: [[0, 0, 0, 0, 4, 0, 0], [0, 0, 1, 4, 4, 0, 0], [0, 1, 2, 3, 2, 4, 0], [1, 2, 3, 3, 3, 2, 1], [0, 1, 2, 3, 2, 4, 0], [0, 0, 1, 4, 4, 0, 0], [0, 0, 0, 0, 4, 0, 0]], eX: -1, eY: 3 },
    { g: [[0, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 1, 1, 4, 4, 0, 0, 0], [0, 1, 2, 3, 3, 2, 4, 0, 0], [1, 2, 3, 3, 3, 3, 2, 4, 1], [0, 1, 2, 3, 3, 2, 4, 0, 0], [0, 0, 1, 1, 4, 4, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0]], eX: -1, eY: 3 },
    { g: [[0, 0, 0, 4, 0], [0, 1, 4, 4, 0], [1, 2, 3, 2, 1], [0, 1, 4, 4, 0], [0, 0, 0, 4, 0]], eX: -1, eY: 2 },
];

// ═══════════════════════════════════════════════
// SpaceBG class
// ═══════════════════════════════════════════════
export class SpaceBG {
    constructor(w, h) {
        this.W = w;
        this.H = h;
        this.stars = [];
        this.bigStars = [];
        this.asteroids = [];
        this.ships = [];
        this.blackHoles = [];
        this.nova = { x: 0, y: 0, baseR: 0, phase: 0, life: 0, maxLife: 3000, active: true };
        this.timers = { ast: 0, ship: 0, bh: 0 };
        this._init();
    }

    _init() {
        this._initStars();
        this._initBigStars();
        this._resetNova();
        for (let i = 0; i < 6; i++) this._spawnAsteroid(true);
        for (let i = 0; i < 2; i++) this._spawnShip(true);
        this._spawnBlackHole();
    }

    _initStars() {
        this.stars = [];
        const W = this.W, H = this.H;
        const area = W * H;
        const layers = [
            { count: 0.00018, spd: 0.06, sz: 1, aMin: 0.12, aMax: 0.28 },
            { count: 0.00012, spd: 0.15, sz: 1, aMin: 0.25, aMax: 0.55 },
            { count: 0.00005, spd: 0.28, sz: 2, aMin: 0.4, aMax: 0.85 },
        ];
        const cols = [C.starWhite, C.starBlue, C.starGold, C.starDim, C.starWhite, C.starWhite];
        for (const L of layers) {
            const n = Math.floor(area * L.count);
            for (let i = 0; i < n; i++) {
                this.stars.push({
                    x: Math.random() * W, y: Math.random() * H,
                    s: L.sz, speed: L.spd + Math.random() * L.spd * 0.4,
                    alpha: L.aMin + Math.random() * (L.aMax - L.aMin),
                    twP: Math.random() * 6.28, twS: 0.008 + Math.random() * 0.02,
                    color: cols[Math.floor(Math.random() * cols.length)],
                });
            }
        }
    }

    _initBigStars() {
        this.bigStars = [];
        const cnt = Math.max(3, Math.floor((this.W * this.H) / 200000));
        for (let i = 0; i < cnt; i++) {
            this.bigStars.push({
                x: Math.random() * this.W, y: Math.random() * this.H,
                sc: PX * (1.2 + Math.random() * 0.8),
                phase: Math.random() * 6.28,
                speed: 0.012 + Math.random() * 0.018,
                pal: Math.random() > 0.4 ? STAR_PAL_W : STAR_PAL_G,
                dx: -(0.02 + Math.random() * 0.05),
            });
        }
    }

    _resetNova() {
        const n = this.nova;
        n.x = this.W * (0.25 + Math.random() * 0.5);
        n.y = this.H * (0.15 + Math.random() * 0.7);
        n.baseR = 35 + Math.random() * 45;
        n.phase = 0; n.life = 0;
        n.maxLife = 2500 + Math.random() * 1500;
        n.active = true;
    }

    _spawnAsteroid(initial) {
        const shape = AST_SHAPES[Math.floor(Math.random() * AST_SHAPES.length)];
        const sc = PX * (1.2 + Math.random() * 1.6);
        this.asteroids.push({
            x: initial ? Math.random() * this.W : this.W + 50,
            y: Math.random() * this.H,
            vx: -(0.1 + Math.random() * 0.3),
            vy: (Math.random() - 0.5) * 0.1,
            shape, sc,
            rot: Math.random() * 6.28,
            rotV: (Math.random() - 0.5) * 0.003,
        });
    }

    _spawnShip(initial) {
        const si = Math.floor(Math.random() * SHIP_GRIDS.length);
        const pals = [C.shipCyan, C.shipRed, C.shipGold];
        const pi = Math.floor(Math.random() * pals.length);
        const right = Math.random() > 0.35;
        const sc = PX * (1 + Math.random() * 0.5);
        this.ships.push({
            x: initial ? Math.random() * this.W : (right ? -30 : this.W + 30),
            y: 30 + Math.random() * (this.H - 60),
            vx: right ? 0.4 + Math.random() * 0.6 : -(0.4 + Math.random() * 0.6),
            vy: (Math.random() - 0.5) * 0.08,
            g: SHIP_GRIDS[si].g, eX: SHIP_GRIDS[si].eX, eY: SHIP_GRIDS[si].eY,
            pal: pals[pi], flPal: pi === 1 ? C.flameRed : C.flame,
            sc, flip: !right, t: 0,
        });
    }

    _spawnBlackHole() {
        this.blackHoles.push({
            x: this.W * (0.2 + Math.random() * 0.6),
            y: this.H * (0.2 + Math.random() * 0.6),
            r: 16 + Math.random() * 20,
            phase: Math.random() * 6.28,
            spin: 0.007 + Math.random() * 0.008,
            life: 0, max: 1800 + Math.random() * 1200,
        });
    }

    // ═══════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════
    update() {
        const W = this.W, H = this.H;

        // Stars
        for (const s of this.stars) {
            s.x -= s.speed;
            s.twP += s.twS;
            if (s.x < -4) s.x = W + 4;
        }

        // Big stars
        for (const b of this.bigStars) {
            b.x += b.dx;
            b.phase += b.speed;
            if (b.x < -30) b.x = W + 30;
        }

        // Nova
        const n = this.nova;
        if (n.active) {
            n.phase += 0.02;
            n.x -= 0.04;
            n.life++;
            if (n.life > n.maxLife) {
                n.active = false;
                setTimeout(() => this._resetNova(), 2000 + Math.random() * 3000);
            }
        }

        // Asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.x += a.vx; a.y += a.vy; a.rot += a.rotV;
            if (a.x < -60) this.asteroids.splice(i, 1);
        }
        this.timers.ast++;
        if (this.timers.ast > 110 + Math.random() * 70) {
            this.timers.ast = 0;
            if (this.asteroids.length < 8) this._spawnAsteroid(false);
        }

        // Ships
        for (let i = this.ships.length - 1; i >= 0; i--) {
            const s = this.ships[i];
            s.x += s.vx; s.y += s.vy; s.t++;
            if (s.x < -50 || s.x > W + 50) this.ships.splice(i, 1);
        }
        this.timers.ship++;
        if (this.timers.ship > 500 + Math.random() * 400) {
            this.timers.ship = 0;
            if (this.ships.length < 3) this._spawnShip(false);
        }

        // Black holes
        for (let i = this.blackHoles.length - 1; i >= 0; i--) {
            const b = this.blackHoles[i];
            b.phase += b.spin; b.life++;
            if (b.life > b.max) this.blackHoles.splice(i, 1);
        }
        this.timers.bh++;
        if (this.timers.bh > 1400 + Math.random() * 800) {
            this.timers.bh = 0;
            if (this.blackHoles.length < 1) this._spawnBlackHole();
        }
    }

    // ═══════════════════════════════════════════
    // DRAW (renders into provided ctx at 0,0)
    // ═══════════════════════════════════════════
    draw(ctx) {
        const W = this.W, H = this.H;

        // Deep space background
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);

        // Vignette
        const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.7);
        vg.addColorStop(0, "rgba(6,6,25,0)");
        vg.addColorStop(1, "rgba(0,0,0,0.45)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);

        // Nova (behind stars)
        this._drawNova(ctx);

        // Stars
        for (const s of this.stars) {
            const tw = 0.5 + Math.sin(s.twP) * 0.4;
            ctx.globalAlpha = s.alpha * tw;
            px(ctx, s.x, s.y, s.s, s.color);
        }
        ctx.globalAlpha = 1;

        // Big sparkling stars
        for (const b of this.bigStars) {
            const spark = 0.35 + Math.sin(b.phase) * 0.35 + Math.sin(b.phase * 2.7) * 0.15;
            if (spark <= 0) continue;

            // Cross flare
            const fl = b.sc * 4 * spark;
            for (let d = 0; d < fl; d += PX) {
                const a = 1 - d / fl;
                ctx.globalAlpha = spark * 0.15 * a;
                const fc = a > 0.5 ? "#ffffff" : b.pal[2];
                px(ctx, b.x + d, b.y, PX, fc);
                px(ctx, b.x - d, b.y, PX, fc);
                px(ctx, b.x, b.y + d, PX, fc);
                px(ctx, b.x, b.y - d, PX, fc);
            }

            // Core
            ctx.globalAlpha = spark * 0.9;
            drawShape(ctx, b.x, b.y, b.sc * (0.9 + spark * 0.12), BIG_STAR, b.pal);

            // Glow
            ctx.globalAlpha = spark * 0.05;
            const sg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.sc * 10);
            sg.addColorStop(0, b.pal[3]);
            sg.addColorStop(1, "transparent");
            ctx.fillStyle = sg;
            ctx.fillRect(b.x - b.sc * 10, b.y - b.sc * 10, b.sc * 20, b.sc * 20);
        }
        ctx.globalAlpha = 1;

        // Black holes
        for (const b of this.blackHoles) this._drawBlackHole(ctx, b);

        // Asteroids
        for (const a of this.asteroids) {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rot);
            drawShape(ctx, 0, 0, a.sc, a.shape, C.rock);
            ctx.restore();
        }

        // Ships
        for (const s of this.ships) this._drawShip(ctx, s);
    }

    // ── Nova ─────────────────────────────────────
    _drawNova(ctx) {
        const n = this.nova;
        if (!n.active) return;
        const fade = Math.min(1, n.life / 200) * Math.min(1, (n.maxLife - n.life) / 200);
        if (fade <= 0) return;

        const pulse = 1 + Math.sin(n.phase) * 0.1;
        const r = n.baseR * pulse;

        // Glow layers
        for (let i = 3; i >= 0; i--) {
            const lr = r * (2 + i * 0.8);
            const a = fade * (0.015 - i * 0.003);
            if (a <= 0) continue;
            ctx.globalAlpha = a;
            const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, lr);
            g.addColorStop(0, C.novaCore);
            g.addColorStop(0.35, C.novaMid);
            g.addColorStop(0.7, C.novaOuter);
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.fillRect(n.x - lr, n.y - lr, lr * 2, lr * 2);
        }

        // Particle ring
        for (let i = 0; i < 24; i++) {
            const ang = n.phase * 0.35 + (i / 24) * 6.28;
            const dist = r * (0.75 + Math.sin(ang * 3 + n.phase) * 0.2);
            const bx = n.x + Math.cos(ang) * dist;
            const by = n.y + Math.sin(ang) * dist;
            const bright = 0.3 + Math.sin(ang * 4 + n.phase) * 0.25;
            ctx.globalAlpha = fade * bright;
            px(ctx, bx, by, PX * (1 + Math.sin(ang * 2 + n.phase * 2) * 0.4), i % 3 === 0 ? C.novaGlow : C.novaMid);
        }

        // Core cluster
        const cs = Math.ceil(r * 0.25 / PX);
        for (let dy = -cs; dy <= cs; dy++) {
            for (let dx = -cs; dx <= cs; dx++) {
                const d2 = dx * dx + dy * dy;
                if (d2 <= cs * cs) {
                    const b = 1 - d2 / (cs * cs);
                    ctx.globalAlpha = fade * (0.12 + b * 0.35);
                    px(ctx, n.x + dx * PX * 2, n.y + dy * PX * 2, PX * 2,
                        b > 0.6 ? "#ffffff" : b > 0.3 ? C.novaGlow : C.novaCore);
                }
            }
        }

        // 4 light rays
        const rl = r * 1.3 * pulse;
        for (let a = 0; a < 4; a++) {
            const ang = a * 1.5708 + n.phase * 0.08;
            for (let d = 0; d < rl; d += PX * 2) {
                ctx.globalAlpha = fade * 0.07 * (1 - d / rl);
                px(ctx, n.x + Math.cos(ang) * d, n.y + Math.sin(ang) * d, PX, C.novaGlow);
            }
        }
        ctx.globalAlpha = 1;
    }

    // ── Ship ─────────────────────────────────────
    _drawShip(ctx, s) {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.flip) ctx.scale(-1, 1);

        drawShape(ctx, 0, 0, s.sc, s.g, s.pal);

        const ex = (s.eX - s.g[0].length / 2) * s.sc - s.sc;
        const ey = (s.eY - s.g.length / 2) * s.sc;
        const flick = Math.sin(s.t * 0.35) * 0.5 + 0.5;
        const len = 2 + Math.floor(flick * 3);
        for (let i = 0; i < len; i++) {
            const ci = Math.min(i, s.flPal.length - 1);
            ctx.globalAlpha = (1 - i / (len + 1)) * 0.85;
            px(ctx, ex - i * s.sc, ey - s.sc * 0.4, s.sc, s.flPal[ci]);
            px(ctx, ex - i * s.sc, ey + s.sc * 0.4, s.sc, s.flPal[ci]);
        }
        ctx.globalAlpha = 0.04 + flick * 0.04;
        const tg = ctx.createRadialGradient(ex - s.sc * 2, ey, 0, ex - s.sc * 2, ey, s.sc * 5);
        tg.addColorStop(0, s.flPal[0]);
        tg.addColorStop(1, "transparent");
        ctx.fillStyle = tg;
        ctx.fillRect(ex - s.sc * 7, ey - s.sc * 3, s.sc * 10, s.sc * 6);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Black hole ───────────────────────────────
    _drawBlackHole(ctx, b) {
        const fi = Math.min(1, b.life / 150);
        const fo = Math.min(1, (b.max - b.life) / 150);
        const f = fi * fo;
        if (f <= 0) return;

        // Accretion ring
        for (let ring = 5; ring >= 0; ring--) {
            const rr = b.r + ring * PX * 3;
            const segs = 18 + ring * 5;
            const ci = Math.min(ring, C.bhRing.length - 1);
            ctx.globalAlpha = f * (0.03 + (5 - ring) * 0.014);
            for (let s = 0; s < segs; s++) {
                const a = b.phase * (ring % 2 === 0 ? 1 : -0.6) + (s / segs) * 6.28;
                px(ctx, b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr * 0.3, PX * 1.2, C.bhRing[ci]);
            }
        }

        // Glow
        ctx.globalAlpha = f * 0.09;
        const gg = ctx.createRadialGradient(b.x, b.y, b.r * 0.3, b.x, b.y, b.r * 2.5);
        gg.addColorStop(0, "#8833ff");
        gg.addColorStop(0.5, C.bhGlow);
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 2.5, 0, 6.28);
        ctx.fill();

        // Core
        ctx.globalAlpha = f * 0.95;
        ctx.fillStyle = "#000006";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.5, 0, 6.28);
        ctx.fill();

        const cs = PX * 2, cr = Math.ceil(b.r * 0.45 / cs);
        for (let dy = -cr; dy <= cr; dy++)
            for (let dx = -cr; dx <= cr; dx++)
                if (dx * dx + dy * dy <= cr * cr) {
                    ctx.globalAlpha = f * 0.85;
                    px(ctx, b.x + dx * cs, b.y + dy * cs, cs, "#010008");
                }
        ctx.globalAlpha = 1;
    }
}
