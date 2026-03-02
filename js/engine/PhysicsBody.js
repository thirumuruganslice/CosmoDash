/**
 * CosmoDash — PhysicsBody
 * Applies physics simulation to an Entity: gravity, friction, terminal velocity,
 * velocity integration. Works as a component — call methods from Entity.update().
 */

import { PHYSICS } from '../utils/Constants.js';

export class PhysicsBody {
    constructor() {
        /** Gravity acceleration in pixels per frame² */
        this.gravity = PHYSICS.GRAVITY;

        /** Maximum fall speed */
        this.terminalVelocity = PHYSICS.MAX_FALL_SPEED;

        /** Ground friction multiplier (applied when grounded) */
        this.groundFriction = PHYSICS.FRICTION_GROUND;

        /** Air friction multiplier (applied when airborne) */
        this.airFriction = PHYSICS.FRICTION_AIR;

        /** Minimum velocity threshold — snap to zero below this */
        this.velocityThreshold = 0.1;
    }

    /**
     * Apply gravity to an entity's vertical velocity.
     * Respects entity.gravityScale and terminal velocity.
     * @param {import('./Entity.js').Entity} entity
     * @param {number} dt — delta time in ms
     */
    applyGravity(entity, dt) {
        if (entity.isStatic || entity.isGrounded) return;

        const dtScale = dt / 16.67;
        entity.velocity.y += this.gravity * entity.gravityScale * dtScale;

        // Enforce terminal velocity
        if (entity.velocity.y > this.terminalVelocity) {
            entity.velocity.y = this.terminalVelocity;
        }
    }

    /**
     * Apply friction to horizontal velocity.
     * Uses ground friction when grounded, air friction when airborne.
     * @param {import('./Entity.js').Entity} entity
     * @param {number} dt — delta time in ms (unused for now, friction is per-frame multiplier)
     */
    applyFriction(entity, dt) {
        if (entity.isStatic) return;

        const friction = entity.isGrounded ? this.groundFriction : this.airFriction;
        entity.velocity.x *= friction;

        // Snap to zero if below threshold
        if (Math.abs(entity.velocity.x) < this.velocityThreshold) {
            entity.velocity.x = 0;
        }
    }

    /**
     * Integrate velocity into position (Euler integration).
     * @param {import('./Entity.js').Entity} entity
     * @param {number} dt — delta time in ms
     */
    integrate(entity, dt) {
        if (entity.isStatic) return;

        const dtScale = dt / 16.67;
        entity.position.x += entity.velocity.x * dtScale;
        entity.position.y += entity.velocity.y * dtScale;
    }

    /**
     * Full physics step: gravity → friction → integrate.
     * Call once per fixed update for each dynamic entity.
     * @param {import('./Entity.js').Entity} entity
     * @param {number} dt — delta time in ms
     */
    step(entity, dt) {
        if (entity.isStatic) return;

        this.applyGravity(entity, dt);
        this.applyFriction(entity, dt);
        this.integrate(entity, dt);
    }
}
