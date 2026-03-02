/**
 * CosmoDash — Nova Rider Character Renderer (Sprite Sheet)
 * Uses per-row sprite images: assets/images/row_0..4.png
 * Each row image has 5 frames packed side-by-side (no gaps).
 *
 * Frame widths within each row: 190, 141, 181, 133, 187 = 832px total
 * Row heights: row0=164, row1=165, row2=163, row3=167, row4=167
 *
 * Sprite row layout (from _row_preview.html):
 *   Row 0 (row_0.png): Idle        (5 frames)
 *   Row 1 (row_1.png): Falling     (5 frames)
 *   Row 2 (row_2.png): Dash        (5 frames)
 *   Row 3 (row_3.png): Running     (5 frames)
 *   Row 4 (row_4.png): Jumping     (5 frames)
 */

// ─── Frame layout within each row image ──────────────
const FRAME_WIDTHS = [190, 141, 181, 133, 187]; // col widths packed sequentially
const FRAME_X = [];  // precomputed x offsets
{
    let xOff = 0;
    for (const fw of FRAME_WIDTHS) {
        FRAME_X.push(xOff);
        xOff += fw;
    }
}

const ROW_HEIGHTS = [164, 165, 163, 167, 167];
const FRAME_COUNT = 5;
const ROW_COUNT = 5;

// Maps anim state → spritesheet row
const STATE_TO_ROW = {};

// Frames-per-second for each animation state
const STATE_FPS = {};

// ─── Row Image Cache ─────────────────────────────────
const _rowImages = new Array(ROW_COUNT).fill(null);
let _spriteReady = false;

/**
 * Load all row sprite images. Call once at game init.
 * @returns {Promise<void>}
 */
export function loadSpriteSheet() {
    if (_spriteReady) return Promise.resolve();

    const promises = [];
    for (let i = 0; i < ROW_COUNT; i++) {
        promises.push(new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { _rowImages[i] = img; resolve(); };
            img.onerror = () => reject(new Error(`row_${i}.png load failed`));
            img.src = `assets/images/row_${i}.png`;
        }));
    }

    return Promise.all(promises).then(() => { _spriteReady = true; });
}

// ─── Animation State Machine ─────────────────────────
export const ANIM_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    FALLING: 'falling',
    DASHING: 'dashing',
    DOUBLE_JUMP: 'doubleJump',
};

// Initialize lookup tables — row index matches row_N.png filename
STATE_TO_ROW[ANIM_STATES.IDLE] = 2;  // use row_2.png for idle as well
STATE_TO_ROW[ANIM_STATES.FALLING] = 1;  // row_1.png
STATE_TO_ROW[ANIM_STATES.DASHING] = 2;  // use row_2.png for dashing too
STATE_TO_ROW[ANIM_STATES.RUNNING] = 2;  // row_2.png
STATE_TO_ROW[ANIM_STATES.JUMPING] = 3;  // row_3.png
STATE_TO_ROW[ANIM_STATES.DOUBLE_JUMP] = 3;  // row_3.png (reuse jump row)

STATE_FPS[ANIM_STATES.IDLE] = 4;
STATE_FPS[ANIM_STATES.RUNNING] = 10;
STATE_FPS[ANIM_STATES.JUMPING] = 6;
STATE_FPS[ANIM_STATES.FALLING] = 6;
STATE_FPS[ANIM_STATES.DASHING] = 12;
STATE_FPS[ANIM_STATES.DOUBLE_JUMP] = 10;

export class NovaRiderAnimController {
    constructor() {
        this.state = ANIM_STATES.IDLE;
        this.timer = 0;
        this.frame = 0;           // current sprite frame (0..4)
        this.frameTimer = 0;      // time accumulated in current frame
        this.runCycle = 0;
        this.breathCycle = 0;
        this.jumpSquash = 0;
        this.spinAngle = 0;
        this.landTimer = 0;
        this._wasGrounded = false;
    }

    update(dt, player) {
        this.timer += dt;

        // Detect landing
        if (!this._wasGrounded && player.isGrounded) {
            this.landTimer = 120;
        }
        if (this.landTimer > 0) this.landTimer -= dt;
        this._wasGrounded = player.isGrounded;

        // Determine state
        let newState;
        if (player.isDashing) {
            newState = ANIM_STATES.DASHING;
        } else if (!player.isGrounded && player.vy < -1) {
            newState = player.jumps >= 2 ? ANIM_STATES.DOUBLE_JUMP : ANIM_STATES.JUMPING;
        } else if (!player.isGrounded && player.vy > 1) {
            newState = ANIM_STATES.FALLING;
        } else if (player.isGrounded && Math.abs(player.vx) > 0.5) {
            newState = ANIM_STATES.RUNNING;
        } else {
            newState = ANIM_STATES.IDLE;
        }

        // Reset frame on state change
        if (newState !== this.state) {
            this.frame = 0;
            this.frameTimer = 0;
        }
        this.state = newState;

        // Advance sprite frame
        const fps = STATE_FPS[this.state] || 6;
        const frameDuration = 1000 / fps;
        this.frameTimer += dt;
        if (this.frameTimer >= frameDuration) {
            this.frameTimer -= frameDuration;
            this.frame = (this.frame + 1) % FRAME_COUNT;
        }

        // Run cycle
        if (this.state === ANIM_STATES.RUNNING) {
            const speed = Math.abs(player.vx);
            this.runCycle = (this.runCycle + (speed * dt * 0.002)) % 1;
        } else {
            this.runCycle = 0;
        }

        // Breath cycle
        this.breathCycle = Math.sin(this.timer * 0.003) * 0.5 + 0.5;

        // Double jump spin
        if (this.state === ANIM_STATES.DOUBLE_JUMP) {
            this.spinAngle += dt * 0.015;
        } else {
            this.spinAngle *= 0.85;
            if (Math.abs(this.spinAngle) < 0.01) this.spinAngle = 0;
        }
    }
}

// ─── Renderer ────────────────────────────────────────
export class NovaRiderRenderer {
    /**
     * Draw Nova Rider using the spritesheet.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - top-left X of hitbox
     * @param {number} y - top-left Y of hitbox
     * @param {number} w - hitbox width  (24)
     * @param {number} h - hitbox height (32)
     * @param {boolean} facingRight
     * @param {NovaRiderAnimController} anim
     * @param {object} [opts]
     */
    static draw(ctx, x, y, w, h, facingRight, anim, opts = {}) {
        if (!_spriteReady) return; // not loaded yet

        const { isDashing = false } = opts;
        const state = anim.state;
        const frame = anim.frame;

        // Source rectangle from row image
        const rowIdx = STATE_TO_ROW[state] ?? 2;
        const colIdx = frame % FRAME_COUNT;
        const rowImg = _rowImages[rowIdx];
        if (!rowImg) return;

        const sx = FRAME_X[colIdx];
        const sy = 0;
        const sw = FRAME_WIDTHS[colIdx];
        const sh = ROW_HEIGHTS[rowIdx];

        // Destination — scale to ~1.8× hitbox height, anchor bottom
        const scale = (h * 1.8) / sh;
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = x + w / 2 - dw / 2;
        const dy = y + h - dh + 2;

        ctx.save();

        // Flip for facing-left
        if (!facingRight) {
            ctx.translate(x + w / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(x + w / 2), 0);
        }

        // Landing squash
        if (anim.landTimer > 0) {
            const t = anim.landTimer / 120;
            const cx = x + w / 2;
            const cy = y + h;
            ctx.translate(cx, cy);
            ctx.scale(1 + t * 0.12, 1 - t * 0.1);
            ctx.translate(-cx, -cy);
        }

        // Jump stretch
        if (state === ANIM_STATES.JUMPING && anim.landTimer <= 0) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            ctx.translate(cx, cy);
            ctx.scale(0.94, 1.05);
            ctx.translate(-cx, -cy);
        }

        // Double-jump tilt
        if (anim.spinAngle !== 0) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            ctx.translate(cx, cy);
            ctx.rotate(Math.sin(anim.spinAngle) * 0.15);
            ctx.translate(-cx, -cy);
        }

        // Draw sprite (pixel-art crisp)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(rowImg, sx, sy, sw, sh, dx, dy, dw, dh);

        // Dash afterimage
        if (isDashing) {
            ctx.globalAlpha = 0.2;
            for (let i = 1; i <= 3; i++) {
                ctx.drawImage(rowImg, sx, sy, sw, sh,
                    dx - i * 10, dy, dw, dh);
                ctx.globalAlpha *= 0.5;
            }
            ctx.globalAlpha = 1;
            // Gold aura
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx - 2, dy - 2, dw + 4, dh + 4);
            ctx.shadowBlur = 0;
        }

        // Ambient energy glow
        if (!isDashing) {
            const pulse = Math.sin(anim.timer * 0.004) * 0.1 + 0.05;
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 3;
            ctx.strokeStyle = `rgba(0, 212, 255, ${pulse})`;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
