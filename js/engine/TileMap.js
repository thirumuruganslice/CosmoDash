/**
 * CosmoDash — TileMap (Phase 3 — Endless Runner Core)
 * Chunk-based procedural terrain generator.
 * Generates ground (with gaps), platforms, stars, and terrain variation
 * ahead of the camera with difficulty scaling based on distance traveled.
 */

import { GAME, COLORS, DIFFICULTY } from '../utils/Constants.js';
import { Entity } from './Entity.js';
import { COLLISION_LAYERS } from '../utils/Constants.js';

// ─────────────────────────────────────────────
// Seeded Random (simple LCG for reproducible runs)
// ─────────────────────────────────────────────

class SeededRandom {
    constructor(seed = Date.now()) {
        this._seed = seed;
        this._state = seed;
    }

    /** Return a float in [0, 1) */
    next() {
        this._state = (this._state * 1664525 + 1013904223) & 0xffffffff;
        return (this._state >>> 0) / 0x100000000;
    }

    /** Return float in [min, max) */
    range(min, max) {
        return min + this.next() * (max - min);
    }

    /** Return int in [min, max] inclusive */
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    /** Return true with given probability */
    chance(probability) {
        return this.next() < probability;
    }

    /** Pick a random element from an array */
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }

    /** Reset to original seed */
    reset() {
        this._state = this._seed;
    }

    get seed() { return this._seed; }
}

// ─────────────────────────────────────────────
// Chunk
// ─────────────────────────────────────────────

class TileChunk {
    constructor(index, chunkWidth) {
        this.index = index;
        this.x = index * chunkWidth;
        this.chunkWidth = chunkWidth;
        this.isActive = true;
        /** @type {Entity[]} */
        this.entities = [];
        /** Whether this chunk has a gap (no ground in some section) */
        this.hasGap = false;
        /** Gap start/end relative to chunk.x */
        this.gapStart = 0;
        this.gapEnd = 0;
        /** Ground Y for this chunk (can vary) */
        this.groundY = 0;
    }

    dispose() {
        this.isActive = false;
        for (const entity of this.entities) {
            entity.isActive = false;
        }
    }
}

// ─────────────────────────────────────────────
// Entity Types
// ─────────────────────────────────────────────

// ─── Shared tile drawing helpers ────────────────────────────────────────────

/**
 * Draw one brick cell: mortar gap is the entity bg, this paints the face + bevel.
 * bx/by = top-left pixel of the face (already 1px inside the mortar gap).
 */
function _drawBrick(ctx, bx, by, bw, bh) {
    if (bh <= 0 || bw <= 0) return;
    // Base face — cleaner, flatter shading
    ctx.fillStyle = '#3a2655';
    ctx.fillRect(bx, by, bw, bh);
    // Subtle top highlight (1px)
    ctx.fillStyle = '#4a2d6a';
    ctx.fillRect(bx, by, bw, 1);
    // Soft inner shadow (1px)
    ctx.fillStyle = '#2a173f';
    ctx.fillRect(bx, by + bh - 1, bw, 1);
}

/** 4×4 pink LED dot with soft glow halo, centred at (cx, cy). */
function _drawLED(ctx, cx, cy) {
    ctx.fillStyle = 'rgba(232,76,163,0.14)';
    ctx.fillRect(cx - 2, cy - 2, 8, 8);
    ctx.fillStyle = '#e84ca3';
    ctx.fillRect(cx, cy, 3, 3);
    ctx.fillStyle = '#ffc1e4';
    ctx.fillRect(cx + 1, cy + 1, 1, 1);
}

/**
 * 4-layer gold/amber cap strip drawn at y=top of an entity.
 * Width w, tile-column divider ticks every TW px.
 */
function _drawGoldCap(ctx, x, y, w) {
    const TW = 32;
    // Layer stack bottom→top
    ctx.fillStyle = '#7a3f06';
    ctx.fillRect(x, y + 3, w, 1);
    ctx.fillStyle = '#c8840c';
    ctx.fillRect(x, y + 2, w, 1);
    ctx.fillStyle = '#f0b82b';
    ctx.fillRect(x, y + 1, w, 1);
    ctx.fillStyle = '#ffd65a';
    ctx.fillRect(x, y, w, 1);
    // Column divider ticks into the cap
    ctx.fillStyle = '#522705';
    for (let col = TW; col < w; col += TW) {
        ctx.fillRect(x + col, y, 1, 3);
    }
    // Bright accent notch at the left of every tile column
    ctx.fillStyle = '#fff0a6';
    for (let col = 0; col < w; col += TW) {
        ctx.fillRect(x + col + 3, y, 3, 1);
    }
}

export class PlatformEntity extends Entity {
    constructor(x, y, width, height = 18) {
        super(x, y, width, height);
        this.tag = 'platform';
        this.isStatic = true;
        this.collisionLayer = COLLISION_LAYERS.GROUND;
    }

    render(ctx) {
        if (!this.isActive) return;
        const { x, y, width: w, height: h } = this;
        const TW = 32, TH = 32;
        const CAP = 4;

        // Mortar base (same col as ground)
        ctx.fillStyle = '#1b1232';
        ctx.fillRect(x, y + CAP, w, h - CAP);

        // Brick grid (same as ground, just narrower height)
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const bx = x + col + 1;
                const by = y + CAP + row + 1;
                const bw = TW - 2;
                const bh2 = Math.min(TH - 2, (y + h) - by - 1);
                _drawBrick(ctx, bx, by, bw, bh2);
            }
        }

        // LED dot per brick cell
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const ledX = x + col + Math.floor(TW / 2) - 2;
                const ledY = y + CAP + row + Math.floor(Math.min(h - CAP, TH) / 2) - 2;
                if (ledY + 4 > y + h - 1) continue;
                _drawLED(ctx, ledX, ledY);
            }
        }

        // Gold cap — identical to ground
        _drawGoldCap(ctx, x, y, w);
    }
}

export class GroundEntity extends Entity {
    constructor(x, y, width, height = 64) {
        super(x, y, width, height);
        this.tag = 'ground';
        this.isStatic = true;
        this.collisionLayer = COLLISION_LAYERS.GROUND;
    }

    render(ctx) {
        if (!this.isActive) return;
        const { x, y, width: w, height: h } = this;
        const TW = 32, TH = 32;
        const CAP = 4; // gold cap height in pixels

        // ── Mortar base (visible as grid gaps between bricks) ────────────────
        ctx.fillStyle = '#1b1232';
        ctx.fillRect(x, y + CAP, w, h - CAP);

        // ── Brick grid ────────────────────────────────────────────────────────
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const bx = x + col + 1;
                const by = y + CAP + row + 1;
                const bw = TW - 2;
                const bh2 = Math.min(TH - 2, (y + h) - by - 1);
                _drawBrick(ctx, bx, by, bw, bh2);
            }
        }

        // ── LED dot per brick ─────────────────────────────────────────────────
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const ledX = x + col + Math.floor(TW / 2) - 2;
                const ledY = y + CAP + row + Math.floor(TH / 2) - 2;
                if (ledY + 4 > y + h - 2) continue;
                _drawLED(ctx, ledX, ledY);
            }
        }

        // ── Gold surface cap ──────────────────────────────────────────────────
        _drawGoldCap(ctx, x, y, w);
    }
}

/**
 * Ground step entity — a small vertical ramp connecting two different ground heights.
 */
export class GroundStepEntity extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, Math.abs(height));
        this.tag = 'ground';
        this.isStatic = true;
        this.collisionLayer = COLLISION_LAYERS.GROUND;
    }

    render(ctx) {
        if (!this.isActive) return;
        const { x, y, width: w, height: h } = this;
        const TW = 32, TH = 32;
        const CAP = 4;

        // Mortar base
        ctx.fillStyle = '#1b1232';
        ctx.fillRect(x, y + CAP, w, h - CAP);

        // Brick grid
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const bx = x + col + 1;
                const by = y + CAP + row + 1;
                const bw = TW - 2;
                const bh2 = Math.min(TH - 2, (y + h) - by - 1);
                _drawBrick(ctx, bx, by, bw, bh2);
            }
        }

        // LED dots
        for (let row = 0; row < h - CAP; row += TH) {
            for (let col = 0; col < w; col += TW) {
                const ledX = x + col + Math.floor(TW / 2) - 2;
                const ledY = y + CAP + row + Math.floor(TH / 2) - 2;
                if (ledY + 4 > y + h - 2) continue;
                _drawLED(ctx, ledX, ledY);
            }
        }

        // Gold cap
        _drawGoldCap(ctx, x, y, w);
    }
}

export class StarEntity extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.tag = 'star';
        this.isTrigger = true;
        this.collisionLayer = COLLISION_LAYERS.COLLECTIBLE;
        this._bobTimer = Math.random() * Math.PI * 2;
        this._baseY = y;
        this.collected = false;
    }

    update(dt) {
        if (!this.isActive || this.collected) return;
        this._bobTimer += dt / 400;
        this.position.y = this._baseY + Math.sin(this._bobTimer) * 4;
    }

    render(ctx) {
        if (!this.isActive || this.collected) return;
        ctx.fillStyle = COLORS.STAR_CORE;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        this._drawStar(ctx, this.centerX, this.centerY, 5, 8, 4);
        ctx.shadowBlur = 0;
    }

    _drawStar(ctx, cx, cy, points, outerR, innerR) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    onTriggerEnter(other) {
        if (other.tag === 'player' && !this.collected) {
            this.collected = true;
            this.isActive = false;
        }
    }
}

// ─────────────────────────────────────────────
// Warning Sign — placed before gaps
// ─────────────────────────────────────────────

class WarningSignEntity extends Entity {
    constructor(x, y) {
        super(x, y, 20, 24);
        this.tag = 'decoration';
        this.isStatic = true;
        this._flash = 0;
    }

    update(dt) {
        this._flash += dt;
    }

    render(ctx) {
        if (!this.isActive) return;
        const flash = Math.sin(this._flash / 300) > 0;
        // Pole
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x + 8, this.y + 10, 4, 14);
        // Sign triangle
        ctx.fillStyle = flash ? '#ff3366' : '#aa2244';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y);
        ctx.lineTo(this.x + 20, this.y + 14);
        ctx.lineTo(this.x, this.y + 14);
        ctx.closePath();
        ctx.fill();
        // Exclamation
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 9, this.y + 4, 2, 5);
        ctx.fillRect(this.x + 9, this.y + 10, 2, 2);
    }
}

// ─────────────────────────────────────────────
// TileMap
// ─────────────────────────────────────────────

export class TileMap {
    constructor() {
        /** @type {Map<number, TileChunk>} */
        this._chunks = new Map();

        this.chunkWidth = GAME.WIDTH;
        this.baseGroundY = GAME.HEIGHT - GAME.GROUND_HEIGHT;
        this.groundHeight = GAME.GROUND_HEIGHT;
        this.generateAhead = 3;
        this.keepBehind = 1;

        /** @type {SeededRandom} */
        this._rng = new SeededRandom();

        /** Current ground Y — carries over between chunks for terrain continuity */
        this._currentGroundY = this.baseGroundY;

        /** @type {import('./EntityManager.js').EntityManager|null} */
        this._entityManager = null;
    }

    /** Get the current seed for display/sharing */
    get seed() { return this._rng.seed; }

    /**
     * Calculate difficulty factor (0–1) based on distance.
     * Uses a smoothstep-like curve through the 5 tiers.
     */
    getDifficulty(distance) {
        const d = Math.max(0, distance);
        if (d >= DIFFICULTY.TIER_5) return 1.0;
        if (d >= DIFFICULTY.TIER_4) return 0.8 + 0.2 * ((d - DIFFICULTY.TIER_4) / (DIFFICULTY.TIER_5 - DIFFICULTY.TIER_4));
        if (d >= DIFFICULTY.TIER_3) return 0.5 + 0.3 * ((d - DIFFICULTY.TIER_3) / (DIFFICULTY.TIER_4 - DIFFICULTY.TIER_3));
        if (d >= DIFFICULTY.TIER_2) return 0.15 + 0.35 * ((d - DIFFICULTY.TIER_2) / (DIFFICULTY.TIER_3 - DIFFICULTY.TIER_2));
        return 0.15 * (d / DIFFICULTY.TIER_2);
    }

    /**
     * Interpolate a value between min and max based on difficulty.
     */
    _lerp(min, max, t) {
        return min + (max - min) * t;
    }

    init(entityManager, seed) {
        this._entityManager = entityManager;
        this._rng = new SeededRandom(seed ?? Date.now());
        this._currentGroundY = this.baseGroundY;

        for (let i = 0; i < this.generateAhead + 1; i++) {
            this._createChunk(i);
        }
    }

    update(cameraX) {
        const currentChunkIndex = Math.floor(cameraX / this.chunkWidth);

        // Generate ahead
        for (let i = currentChunkIndex; i <= currentChunkIndex + this.generateAhead; i++) {
            if (!this._chunks.has(i)) {
                this._createChunk(i);
            }
        }

        // Dispose behind
        for (const [index, chunk] of this._chunks) {
            if (index < currentChunkIndex - this.keepBehind) {
                chunk.dispose();
                this._chunks.delete(index);
            }
        }
    }

    _createChunk(index) {
        const chunk = new TileChunk(index, this.chunkWidth);
        const rng = this._rng;
        const distance = chunk.x;
        const diff = this.getDifficulty(distance);

        // ── Ground height variation ──
        if (index > 1 && rng.chance(DIFFICULTY.GROUND_STEP_CHANCE * (0.5 + diff))) {
            const step = rng.int(DIFFICULTY.GROUND_STEP_MIN, DIFFICULTY.GROUND_STEP_MAX);
            const newY = Math.max(
                GAME.HEIGHT - 160,   // don't go too high
                Math.min(
                    GAME.HEIGHT - 32, // don't go below screen
                    this._currentGroundY + step
                )
            );
            // Add a step block to connect old ground to new ground
            if (newY !== this._currentGroundY) {
                const stepWidth = 32;
                const stepY = Math.min(newY, this._currentGroundY);
                const stepH = Math.abs(newY - this._currentGroundY);
                const stepEnt = new GroundStepEntity(chunk.x, stepY, stepWidth, stepH);
                chunk.entities.push(stepEnt);
                this._entityManager.add(stepEnt);
            }
            this._currentGroundY = newY;
        }

        chunk.groundY = this._currentGroundY;

        // ── Gap generation ──
        const gapChance = this._lerp(DIFFICULTY.GAP_CHANCE_MIN, DIFFICULTY.GAP_CHANCE_MAX, diff);
        // No gaps in first 2 chunks (safe zone)
        if (index > 2 && rng.chance(gapChance)) {
            const gapWidth = Math.floor(this._lerp(
                DIFFICULTY.GAP_WIDTH_MIN,
                DIFFICULTY.GAP_WIDTH_MAX,
                diff * rng.range(0.5, 1.0) // some randomness in gap size
            ));
            // Position gap somewhere in the middle 60% of the chunk
            const margin = this.chunkWidth * 0.2;
            const gapStart = Math.floor(margin + rng.next() * (this.chunkWidth - 2 * margin - gapWidth));
            const gapEnd = gapStart + gapWidth;

            chunk.hasGap = true;
            chunk.gapStart = gapStart;
            chunk.gapEnd = gapEnd;

            // Ground left of gap
            if (gapStart > 0) {
                const leftGround = new GroundEntity(
                    chunk.x,
                    chunk.groundY,
                    gapStart,
                    this.groundHeight + (GAME.HEIGHT - chunk.groundY)
                );
                chunk.entities.push(leftGround);
                this._entityManager.add(leftGround);
            }

            // Ground right of gap
            if (gapEnd < this.chunkWidth) {
                const rightGround = new GroundEntity(
                    chunk.x + gapEnd,
                    chunk.groundY,
                    this.chunkWidth - gapEnd,
                    this.groundHeight + (GAME.HEIGHT - chunk.groundY)
                );
                chunk.entities.push(rightGround);
                this._entityManager.add(rightGround);
            }

            // Warning sign before gap
            const signX = chunk.x + gapStart - 30;
            const signY = chunk.groundY - 24;
            const sign = new WarningSignEntity(signX, signY);
            chunk.entities.push(sign);
            this._entityManager.add(sign);

            // Rescue platform over wide gaps
            if (gapWidth > 140) {
                const rescuePlatW = Math.floor(rng.range(48, 80));
                const rescuePlatX = chunk.x + gapStart + (gapWidth - rescuePlatW) / 2;
                const rescuePlatY = chunk.groundY - rng.range(30, 60);
                const rescuePlat = new PlatformEntity(rescuePlatX, rescuePlatY, rescuePlatW);
                chunk.entities.push(rescuePlat);
                this._entityManager.add(rescuePlat);

                // Star on rescue platform
                if (rng.chance(0.8)) {
                    const star = new StarEntity(rescuePlatX + rescuePlatW / 2 - 8, rescuePlatY - 28);
                    chunk.entities.push(star);
                    this._entityManager.add(star);
                }
            }
        } else {
            // Full ground, no gap
            const ground = new GroundEntity(
                chunk.x,
                chunk.groundY,
                this.chunkWidth,
                this.groundHeight + (GAME.HEIGHT - chunk.groundY)
            );
            chunk.entities.push(ground);
            this._entityManager.add(ground);
        }

        // ── Platforms ──
        if (index === 0) {
            // First chunk — starter platforms
            const starters = this._generateStarterPlatforms(chunk);
            for (const p of starters) {
                chunk.entities.push(p);
                this._entityManager.add(p);
            }
            this._generateStarsOnPlatforms(chunk, starters);
        } else {
            const platforms = this._generatePlatforms(chunk, diff);
            for (const p of platforms) {
                chunk.entities.push(p);
                this._entityManager.add(p);
            }
            this._generateStarsOnPlatforms(chunk, platforms);

            // Ground-level stars (between gaps)
            this._generateGroundStars(chunk, diff);
        }

        this._chunks.set(index, chunk);
    }

    _generateStarterPlatforms(chunk) {
        const baseY = chunk.groundY;
        return [
            new PlatformEntity(chunk.x + 250, baseY - 80, 128),
            new PlatformEntity(chunk.x + 450, baseY - 150, 96),
            new PlatformEntity(chunk.x + 650, baseY - 100, 160),
            new PlatformEntity(chunk.x + 100, baseY - 200, 80),
        ];
    }

    _generatePlatforms(chunk, diff) {
        const rng = this._rng;
        const platforms = [];
        const baseY = chunk.groundY;
        const count = rng.int(
            DIFFICULTY.PLATFORM_COUNT_MIN,
            Math.floor(this._lerp(DIFFICULTY.PLATFORM_COUNT_MIN + 1, DIFFICULTY.PLATFORM_COUNT_MAX, diff))
        );

        for (let i = 0; i < count; i++) {
            const w = Math.floor(this._lerp(
                DIFFICULTY.PLATFORM_WIDTH_MAX,
                DIFFICULTY.PLATFORM_WIDTH_MIN,
                diff * rng.range(0.6, 1.0)
            ));
            const x = chunk.x + 60 + rng.next() * (this.chunkWidth - w - 120);
            const y = baseY - 50 - rng.next() * 220;

            // Don't place platform inside a gap region at ground level
            if (chunk.hasGap && y > baseY - 40) {
                const platRight = x + w - chunk.x;
                const platLeft = x - chunk.x;
                if (platRight > chunk.gapStart && platLeft < chunk.gapEnd) {
                    continue; // skip — would be inside gap
                }
            }

            platforms.push(new PlatformEntity(x, y, w));
        }
        return platforms;
    }

    _generateStarsOnPlatforms(chunk, platforms) {
        const rng = this._rng;
        for (const plat of platforms) {
            if (rng.chance(0.65)) {
                const star = new StarEntity(plat.x + plat.width / 2 - 8, plat.y - 28);
                chunk.entities.push(star);
                this._entityManager.add(star);
            }
        }
    }

    _generateGroundStars(chunk, diff) {
        const rng = this._rng;
        // Scatter 0-2 stars on the ground surface (outside gaps)
        const count = rng.int(0, 2);
        for (let i = 0; i < count; i++) {
            const localX = rng.range(40, this.chunkWidth - 40);
            // Skip if inside gap
            if (chunk.hasGap && localX > chunk.gapStart - 16 && localX < chunk.gapEnd + 16) continue;
            const star = new StarEntity(chunk.x + localX, chunk.groundY - 28);
            chunk.entities.push(star);
            this._entityManager.add(star);
        }
    }

    /** Get the ground Y at a given chunk index (for external reference) */
    getGroundYAtChunk(index) {
        const chunk = this._chunks.get(index);
        return chunk ? chunk.groundY : this.baseGroundY;
    }

    /** Check if a world X position is over a gap */
    isOverGap(worldX) {
        const idx = Math.floor(worldX / this.chunkWidth);
        const chunk = this._chunks.get(idx);
        if (!chunk || !chunk.hasGap) return false;
        const localX = worldX - chunk.x;
        return localX >= chunk.gapStart && localX <= chunk.gapEnd;
    }

    getAllEntities() {
        const entities = [];
        for (const chunk of this._chunks.values()) {
            if (!chunk.isActive) continue;
            for (const entity of chunk.entities) {
                if (entity.isActive) entities.push(entity);
            }
        }
        return entities;
    }

    getStaticEntities() {
        return this.getAllEntities().filter(e => e.isStatic && e.isActive);
    }

    getTriggerEntities() {
        return this.getAllEntities().filter(e => e.isTrigger && e.isActive);
    }

    clear() {
        for (const chunk of this._chunks.values()) {
            chunk.dispose();
        }
        this._chunks.clear();
        this._currentGroundY = this.baseGroundY;
    }
}
