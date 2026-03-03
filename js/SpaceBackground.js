/* ============================================
   CosmoDash — Static Space Background
   Draws a static image + sparkling stars overlay
   ============================================ */

const STAR_COUNT = 200;   // total twinkling stars
const MIN_RADIUS = 0.4;   // px
const MAX_RADIUS = 1.6;   // px

function _randomStar(W, H) {
    return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        // phase offset so stars don't all pulse in sync
        phase: Math.random() * Math.PI * 2,
        // cycle speed — radians per ms
        speed: 0.0008 + Math.random() * 0.0018,
        // base alpha and how much it swings
        baseA: 0.35 + Math.random() * 0.35,
        swing: 0.20 + Math.random() * 0.40,
        // colour: mostly white/blue-white, occasional warm tone
        hue: Math.random() < 0.15 ? `255,220,160` : `200,220,255`,
    };
}

export class SpaceBG {
    constructor(w, h) {
        this.W = w;
        this.H = h;

        // Background image
        this._img = new Image();
        this._loaded = false;
        this._img.onload = () => { this._loaded = true; };
        this._img.src = 'assets/images/bg/CosmoDashPlainBG.png';

        // Build star field
        this._stars = Array.from({ length: STAR_COUNT }, () => _randomStar(w, h));
        this._t = 0;   // elapsed ms
    }

    /** Advance the sparkle animation */
    update(dt = 16) {
        this._t += dt;
    }

    /** Draw background image then render sparkling stars on top */
    draw(ctx) {
        // --- background ---
        if (this._loaded) {
            ctx.drawImage(this._img, 0, 0, this.W, this.H);
        } else {
            ctx.fillStyle = '#030310';
            ctx.fillRect(0, 0, this.W, this.H);
        }

        // --- twinkling stars ---
        const t = this._t;
        ctx.save();
        for (const s of this._stars) {
            // sine wave alpha
            const alpha = Math.max(0, s.baseA + s.swing * Math.sin(s.phase + t * s.speed));
            const r = s.r * (0.85 + 0.15 * Math.sin(s.phase + t * s.speed * 1.3));

            // soft glow — larger, very translucent halo
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
            glow.addColorStop(0, `rgba(${s.hue},${alpha})`);
            glow.addColorStop(0.4, `rgba(${s.hue},${alpha * 0.3})`);
            glow.addColorStop(1, `rgba(${s.hue},0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2);
            ctx.fill();

            // bright core
            ctx.fillStyle = `rgba(${s.hue},${Math.min(1, alpha + 0.3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}




