/**
 * CosmoDash — EntityManager
 * Manages the lifecycle of all game entities: adding, removing, updating, rendering,
 * and cleaning up off-screen entities. Supports tagging and querying.
 */

export class EntityManager {
    constructor() {
        /** @type {import('./Entity.js').Entity[]} All active entities */
        this._entities = [];

        /** Entities queued to be added at end of frame (avoids mutation during iteration) */
        this._addQueue = [];

        /** Tags index for fast lookups */
        this._tagIndex = new Map();
    }

    /**
     * Add an entity to the manager.
     * If called during update, entity is queued and added after the current frame.
     * @param {import('./Entity.js').Entity} entity
     * @returns {import('./Entity.js').Entity} the entity (for chaining)
     */
    add(entity) {
        this._addQueue.push(entity);
        return entity;
    }

    /**
     * Remove an entity by marking it inactive.
     * It will be cleaned up in the next flush.
     * @param {import('./Entity.js').Entity} entity
     */
    remove(entity) {
        entity.isActive = false;
    }

    /**
     * Get all entities with a specific tag.
     * @param {string} tag
     * @returns {import('./Entity.js').Entity[]}
     */
    getByTag(tag) {
        return this._entities.filter(e => e.isActive && e.tag === tag);
    }

    /**
     * Get the first entity with a specific tag.
     * @param {string} tag
     * @returns {import('./Entity.js').Entity|null}
     */
    getFirstByTag(tag) {
        return this._entities.find(e => e.isActive && e.tag === tag) || null;
    }

    /**
     * Get all active entities.
     * @returns {import('./Entity.js').Entity[]}
     */
    getAll() {
        return this._entities.filter(e => e.isActive);
    }

    /** Get total count of active entities */
    get count() {
        return this._entities.filter(e => e.isActive).length;
    }

    /**
     * Update all active entities.
     * @param {number} dt — delta time in ms
     * @param {object} game — Game instance reference
     */
    update(dt, game) {
        // Flush add queue
        this._flush();

        // Update all active entities
        for (const entity of this._entities) {
            if (entity.isActive) {
                entity.update(dt, game);
            }
        }
    }

    /**
     * Render all active entities.
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('./Camera.js').Camera} camera
     */
    render(ctx, camera) {
        for (const entity of this._entities) {
            if (!entity.isActive) continue;

            // Culling: skip entities outside camera view
            if (camera && !camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
                continue;
            }

            entity.render(ctx, camera);
        }
    }

    /**
     * Render debug overlays for all active entities.
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('./Camera.js').Camera} camera
     */
    renderDebug(ctx, camera) {
        for (const entity of this._entities) {
            if (!entity.isActive) continue;
            if (camera && !camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
                continue;
            }
            entity.renderDebug(ctx, entity.isTrigger ? '#ff0' : entity.isStatic ? '#0ff' : '#0f0');
        }
    }

    /**
     * Remove entities that are far behind the camera (cleanup for endless runner).
     * @param {number} cameraX — current camera X position
     * @param {number} margin — pixels behind camera before cleanup (default: 512)
     */
    cleanupBehindCamera(cameraX, margin = 512) {
        for (const entity of this._entities) {
            if (!entity.isActive) continue;
            if (entity.tag === 'player') continue; // never cleanup player

            if (entity.x + entity.width < cameraX - margin) {
                entity.isActive = false;
            }
        }
    }

    /**
     * Remove entities that fell below a Y threshold.
     * @param {number} maxY — Y position below which entities are removed
     */
    cleanupBelowY(maxY) {
        for (const entity of this._entities) {
            if (!entity.isActive) continue;
            if (entity.y > maxY) {
                entity.isActive = false;
            }
        }
    }

    /**
     * Flush the add queue and purge inactive entities.
     */
    _flush() {
        // Add queued entities
        if (this._addQueue.length > 0) {
            this._entities.push(...this._addQueue);
            this._addQueue.length = 0;
        }

        // Purge inactive entities (periodically, when >25% are dead)
        const inactiveCount = this._entities.filter(e => !e.isActive).length;
        if (inactiveCount > this._entities.length * 0.25 || inactiveCount > 50) {
            this._entities = this._entities.filter(e => e.isActive);
        }
    }

    /** Remove all entities */
    clear() {
        for (const entity of this._entities) {
            entity.isActive = false;
        }
        this._entities.length = 0;
        this._addQueue.length = 0;
    }
}
