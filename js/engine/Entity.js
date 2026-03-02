/**
 * CosmoDash — Entity
 * Base class for all game objects (player, obstacles, collectibles, platforms).
 * Provides position, velocity, size, bounds, and lifecycle methods.
 */

import { Vector2 } from '../utils/Vector2.js';

export class Entity {
    /**
     * @param {number} x — world X position
     * @param {number} y — world Y position
     * @param {number} width — hitbox width
     * @param {number} height — hitbox height
     */
    constructor(x = 0, y = 0, width = 32, height = 32) {
        /** World position (top-left corner of hitbox) */
        this.position = new Vector2(x, y);

        /** Velocity in pixels per frame */
        this.velocity = new Vector2(0, 0);

        /** Hitbox dimensions */
        this.width = width;
        this.height = height;

        /** Whether this entity is alive and should be updated/rendered */
        this.isActive = true;

        /** Whether the entity is touching ground */
        this.isGrounded = false;

        /** Facing direction (true = right) */
        this.facingRight = true;

        /** Tag for identifying entity types in collision queries */
        this.tag = 'entity';

        /** Collision layer (bitmask). See COLLISION_LAYERS in Constants. */
        this.collisionLayer = 0;

        /** Collision mask — which layers this entity collides WITH */
        this.collisionMask = 0;

        /** Whether this entity is a static object (platforms, ground) — skips physics */
        this.isStatic = false;

        /** Whether this is a trigger volume (overlap only, no physical response) */
        this.isTrigger = false;

        /** Gravity scale multiplier (0 = no gravity, 1 = normal, 2 = heavy) */
        this.gravityScale = 1.0;
    }

    // ---- Getters for convenient access ----

    get x() { return this.position.x; }
    set x(val) { this.position.x = val; }

    get y() { return this.position.y; }
    set y(val) { this.position.y = val; }

    get vx() { return this.velocity.x; }
    set vx(val) { this.velocity.x = val; }

    get vy() { return this.velocity.y; }
    set vy(val) { this.velocity.y = val; }

    /** Center X in world space */
    get centerX() { return this.position.x + this.width / 2; }

    /** Center Y in world space */
    get centerY() { return this.position.y + this.height / 2; }

    /** Bottom edge Y */
    get bottom() { return this.position.y + this.height; }

    /** Right edge X */
    get right() { return this.position.x + this.width; }

    /**
     * Get the axis-aligned bounding box for this entity.
     * @returns {{ x: number, y: number, width: number, height: number }}
     */
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height,
        };
    }

    /**
     * Update logic — override in subclasses.
     * @param {number} dt — delta time in ms
     * @param {object} game — reference to the Game instance
     */
    update(dt, game) {
        // Base entities do nothing — subclasses override
    }

    /**
     * Render the entity — override in subclasses.
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('./Camera.js').Camera} camera
     */
    render(ctx, camera) {
        // Base: draw a colored rectangle (placeholder)
        if (!this.isActive) return;
        ctx.fillStyle = '#888';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    /**
     * Render debug information (hitbox outline).
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} [color='#0f0']
     */
    renderDebug(ctx, color = '#0f0') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    }

    /**
     * Called when this entity collides with another entity.
     * Override in subclasses for custom collision responses.
     * @param {Entity} other — the entity we collided with
     * @param {object} collision — collision data { overlapX, overlapY, normalX, normalY }
     */
    onCollision(other, collision) {
        // Override in subclasses
    }

    /**
     * Called when this trigger entity overlaps another entity.
     * @param {Entity} other
     */
    onTriggerEnter(other) {
        // Override in subclasses
    }

    /** Mark entity for removal */
    destroy() {
        this.isActive = false;
    }

    /**
     * Reset entity state for object pooling reuse.
     * @param {number} x
     * @param {number} y
     */
    reset(x = 0, y = 0) {
        this.position.set(x, y);
        this.velocity.set(0, 0);
        this.isActive = true;
        this.isGrounded = false;
        this.facingRight = true;
    }
}
