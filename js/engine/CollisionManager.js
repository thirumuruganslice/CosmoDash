/**
 * CosmoDash — CollisionManager
 * Handles AABB collision detection and resolution between entities.
 * Supports collision layers/masks, one-way platforms, and trigger volumes.
 */

import { COLLISION_LAYERS } from '../utils/Constants.js';

export class CollisionManager {
    constructor() {
        /** Collision callback registry */
        this._callbacks = [];

        /** Spatial grid cell size (for broad-phase optimization) */
        this._cellSize = 128;

        /** Spatial grid */
        this._grid = new Map();
    }

    /**
     * Register a collision callback.
     * @param {string} tagA — tag of first entity type
     * @param {string} tagB — tag of second entity type
     * @param {Function} callback — (entityA, entityB, collision) => void
     */
    onCollision(tagA, tagB, callback) {
        this._callbacks.push({ tagA, tagB, callback });
    }

    /**
     * Test AABB overlap between two entities.
     * @param {import('./Entity.js').Entity} a
     * @param {import('./Entity.js').Entity} b
     * @returns {boolean}
     */
    static testAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Get AABB overlap data between two entities.
     * Returns null if no overlap.
     * @param {import('./Entity.js').Entity} a
     * @param {import('./Entity.js').Entity} b
     * @returns {{ overlapX: number, overlapY: number, normalX: number, normalY: number } | null}
     */
    static getOverlap(a, b) {
        const aRight = a.x + a.width;
        const aBottom = a.y + a.height;
        const bRight = b.x + b.width;
        const bBottom = b.y + b.height;

        const overlapX = Math.min(aRight, bRight) - Math.max(a.x, b.x);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(a.y, b.y);

        if (overlapX <= 0 || overlapY <= 0) return null;

        // Determine push direction (from B's center to A's center)
        const dx = a.centerX - b.centerX;
        const dy = a.centerY - b.centerY;

        return {
            overlapX,
            overlapY,
            normalX: dx > 0 ? 1 : -1,
            normalY: dy > 0 ? 1 : -1,
        };
    }

    /**
     * Check if two entities should collide based on their layer/mask.
     * @param {import('./Entity.js').Entity} a
     * @param {import('./Entity.js').Entity} b
     * @returns {boolean}
     */
    static shouldCollide(a, b) {
        return (a.collisionMask & b.collisionLayer) !== 0 ||
            (b.collisionMask & a.collisionLayer) !== 0;
    }

    /**
     * Build the spatial hash grid for broad-phase collision detection.
     * @param {import('./Entity.js').Entity[]} entities
     */
    _buildGrid(entities) {
        this._grid.clear();

        for (const entity of entities) {
            if (!entity.isActive) continue;

            const startX = Math.floor(entity.x / this._cellSize);
            const endX = Math.floor((entity.x + entity.width) / this._cellSize);
            const startY = Math.floor(entity.y / this._cellSize);
            const endY = Math.floor((entity.y + entity.height) / this._cellSize);

            for (let gx = startX; gx <= endX; gx++) {
                for (let gy = startY; gy <= endY; gy++) {
                    const key = `${gx},${gy}`;
                    if (!this._grid.has(key)) {
                        this._grid.set(key, []);
                    }
                    this._grid.get(key).push(entity);
                }
            }
        }
    }

    /**
     * Resolve collision between a dynamic entity and a static entity.
     * Pushes the dynamic entity out of the static entity on the axis of minimum penetration.
     * @param {import('./Entity.js').Entity} dynamic — the moving entity
     * @param {import('./Entity.js').Entity} staticEnt — the immovable entity
     * @param {object} overlap — overlap data from getOverlap()
     * @param {boolean} isOneWayPlatform — if true, only resolve when falling from above
     */
    resolveStaticCollision(dynamic, staticEnt, overlap, isOneWayPlatform = false) {
        if (!overlap) return;

        if (isOneWayPlatform) {
            // Only collide if player is falling and their feet were above the platform top
            const feetY = dynamic.y + dynamic.height;
            const platTop = staticEnt.y;
            const wasFalling = dynamic.velocity.y >= 0;
            const feetNearTop = feetY <= platTop + dynamic.velocity.y + 6;

            if (!wasFalling || !feetNearTop) return;

            // Resolve vertically only (push up)
            dynamic.position.y = staticEnt.y - dynamic.height;
            dynamic.velocity.y = 0;
            dynamic.isGrounded = true;
            return;
        }

        // Resolve on minimum penetration axis
        if (overlap.overlapX < overlap.overlapY) {
            // Push horizontally
            dynamic.position.x += overlap.overlapX * overlap.normalX;
            dynamic.velocity.x = 0;
        } else {
            // Push vertically
            dynamic.position.y += overlap.overlapY * overlap.normalY;

            if (overlap.normalY < 0) {
                // Pushed up — entity landed on top
                dynamic.velocity.y = 0;
                dynamic.isGrounded = true;
            } else {
                // Pushed down — entity hit ceiling
                dynamic.velocity.y = 0;
            }
        }
    }

    /**
     * Process all collisions between a dynamic entity and a list of static entities.
     * @param {import('./Entity.js').Entity} dynamic — player or moving entity
     * @param {import('./Entity.js').Entity[]} statics — platforms, ground blocks
     */
    resolveAgainstStatics(dynamic, statics) {
        if (!dynamic.isActive) return;

        // Reset grounded state before collision checks
        dynamic.isGrounded = false;

        for (const staticEnt of statics) {
            if (!staticEnt.isActive) continue;
            if (!CollisionManager.testAABB(dynamic, staticEnt)) continue;

            const overlap = CollisionManager.getOverlap(dynamic, staticEnt);
            if (!overlap) continue;

            const isOneWay = staticEnt.tag === 'platform';

            if (staticEnt.isTrigger) {
                // Trigger — just notify, don't resolve physically
                dynamic.onTriggerEnter(staticEnt);
                staticEnt.onTriggerEnter(dynamic);
            } else {
                // Physical collision — resolve
                this.resolveStaticCollision(dynamic, staticEnt, overlap, isOneWay);

                // Notify both entities
                dynamic.onCollision(staticEnt, overlap);
                staticEnt.onCollision(dynamic, overlap);
            }
        }

        // Fire registered callbacks
        this._fireCallbacks(dynamic, statics);
    }

    /**
     * Check overlap between a dynamic entity and trigger entities.
     * Does not resolve physically — just fires callbacks.
     * @param {import('./Entity.js').Entity} dynamic
     * @param {import('./Entity.js').Entity[]} triggers
     */
    checkTriggers(dynamic, triggers) {
        if (!dynamic.isActive) return;

        for (const trigger of triggers) {
            if (!trigger.isActive || !trigger.isTrigger) continue;
            if (!CollisionManager.testAABB(dynamic, trigger)) continue;

            dynamic.onTriggerEnter(trigger);
            trigger.onTriggerEnter(dynamic);
        }
    }

    /**
     * Fire registered collision callbacks.
     * @param {import('./Entity.js').Entity} entityA
     * @param {import('./Entity.js').Entity[]} entitiesB
     */
    _fireCallbacks(entityA, entitiesB) {
        for (const { tagA, tagB, callback } of this._callbacks) {
            for (const entityB of entitiesB) {
                if (!entityB.isActive) continue;
                if (
                    (entityA.tag === tagA && entityB.tag === tagB) ||
                    (entityA.tag === tagB && entityB.tag === tagA)
                ) {
                    if (CollisionManager.testAABB(entityA, entityB)) {
                        callback(entityA, entityB);
                    }
                }
            }
        }
    }
}
