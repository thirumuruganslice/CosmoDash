/**
 * CosmoDash — Camera
 * Viewport camera with smooth follow, dead zones, lookahead, and screen bounds clamping.
 */

import { GAME, CAMERA } from '../utils/Constants.js';
import { Vector2 } from '../utils/Vector2.js';

export class Camera {
    constructor() {
        /** Camera position (top-left corner of viewport in world space) */
        this.position = new Vector2(0, 0);

        /** Target position to follow */
        this._target = new Vector2(0, 0);

        /** World bounds (set per level) */
        this.worldWidth = GAME.WIDTH;
        this.worldHeight = GAME.HEIGHT;

        /** Viewport size */
        this.viewWidth = GAME.WIDTH;
        this.viewHeight = GAME.HEIGHT;

        /** Smooth follow speed */
        this.lerpSpeed = CAMERA.LERP_SPEED;

        /** Lookahead distance */
        this.lookaheadX = CAMERA.LOOKAHEAD_X;
        this.lookaheadY = CAMERA.LOOKAHEAD_Y;

        /** Dead zone (pixels from center before camera moves) */
        this.deadZoneX = CAMERA.DEAD_ZONE_X;
        this.deadZoneY = CAMERA.DEAD_ZONE_Y;

        /** Shake state */
        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
        this._shakeOffset = new Vector2(0, 0);

        /** Whether camera is locked (e.g., during cutscene) */
        this._locked = false;

        /** Current facing direction of the tracked entity (for lookahead) */
        this._facingX = 0;
        this._facingY = 0;
    }

    /**
     * Set world bounds for camera clamping.
     * @param {number} width — total world width in pixels
     * @param {number} height — total world height in pixels
     */
    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }

    /**
     * Instantly center the camera on a position (no lerp).
     * @param {number} x — center X in world space
     * @param {number} y — center Y in world space
     */
    centerOn(x, y) {
        this.position.x = x - this.viewWidth / 2;
        this.position.y = y - this.viewHeight / 2;
        this._target.set(this.position.x, this.position.y);
        this._clamp();
    }

    /**
     * Follow a target entity smoothly.
     * Call this every frame with the entity's center position.
     * @param {number} x — entity center X
     * @param {number} y — entity center Y
     * @param {number} facingX — -1, 0, or 1 (direction for lookahead)
     * @param {number} [facingY=0]
     */
    follow(x, y, facingX = 0, facingY = 0) {
        if (this._locked) return;

        this._facingX = facingX;
        this._facingY = facingY;

        // Target: center the entity in viewport + lookahead
        const targetX = x - this.viewWidth / 2 + facingX * this.lookaheadX;
        const targetY = y - this.viewHeight / 2 + facingY * this.lookaheadY;

        this._target.set(targetX, targetY);
    }

    /**
     * Update camera position (call every frame after follow()).
     * @param {number} dt — delta time in ms
     */
    update(dt) {
        if (!this._locked) {
            // Dead zone check — only move if target is far enough from current position
            const dx = this._target.x - this.position.x;
            const dy = this._target.y - this.position.y;

            if (Math.abs(dx) > this.deadZoneX) {
                this.position.x += dx * this.lerpSpeed;
            }
            if (Math.abs(dy) > this.deadZoneY) {
                this.position.y += dy * this.lerpSpeed;
            }
        }

        // Process screen shake
        this._updateShake(dt);

        // Clamp to world bounds
        this._clamp();
    }

    /** Clamp camera position within world bounds */
    _clamp() {
        const maxX = Math.max(0, this.worldWidth - this.viewWidth);
        const maxY = Math.max(0, this.worldHeight - this.viewHeight);

        this.position.x = Math.max(0, Math.min(maxX, this.position.x));
        this.position.y = Math.max(0, Math.min(maxY, this.position.y));
    }

    // ---- Screen Shake ----

    /**
     * Trigger screen shake.
     * @param {number} intensity — max pixel offset
     * @param {number} duration — ms
     */
    shake(intensity = 5, duration = 200) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }

    _updateShake(dt) {
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            const progress = this._shakeTimer / this._shakeDuration;
            const currentIntensity = this._shakeIntensity * progress; // decay
            this._shakeOffset.x = (Math.random() * 2 - 1) * currentIntensity;
            this._shakeOffset.y = (Math.random() * 2 - 1) * currentIntensity;
        } else {
            this._shakeOffset.set(0, 0);
        }
    }

    // ---- Transform helpers ----

    /** Get the X offset to apply to canvas rendering (includes shake) */
    get offsetX() {
        return -Math.round(this.position.x) + this._shakeOffset.x;
    }

    /** Get the Y offset to apply to canvas rendering (includes shake) */
    get offsetY() {
        return -Math.round(this.position.y) + this._shakeOffset.y;
    }

    /**
     * Convert screen coordinates to world coordinates.
     * Useful for mouse/touch input.
     */
    screenToWorld(screenX, screenY) {
        return new Vector2(
            screenX + this.position.x,
            screenY + this.position.y
        );
    }

    /**
     * Convert world coordinates to screen coordinates.
     */
    worldToScreen(worldX, worldY) {
        return new Vector2(
            worldX - this.position.x,
            worldY - this.position.y
        );
    }

    /**
     * Check if a world-space rectangle is visible on screen.
     * Useful for culling off-screen entities.
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} [margin=32] — extra pixels of margin
     */
    isVisible(x, y, width, height, margin = 32) {
        return (
            x + width + margin > this.position.x &&
            x - margin < this.position.x + this.viewWidth &&
            y + height + margin > this.position.y &&
            y - margin < this.position.y + this.viewHeight
        );
    }

    /** Lock camera in place */
    lock() {
        this._locked = true;
    }

    /** Unlock camera */
    unlock() {
        this._locked = false;
    }

    get isLocked() {
        return this._locked;
    }
}
