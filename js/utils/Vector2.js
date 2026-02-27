/**
 * CosmoDash — Vector2
 * 2D vector utility class for positions, velocities, and general math.
 */

export class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /** Create a copy of this vector */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /** Set both components */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /** Copy values from another vector */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /** Add another vector (mutates) */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /** Subtract another vector (mutates) */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /** Multiply by scalar (mutates) */
    scale(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /** Multiply component-wise (mutates) */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    /** Get the magnitude (length) */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /** Get squared magnitude (avoids sqrt, good for comparisons) */
    magnitudeSq() {
        return this.x * this.x + this.y * this.y;
    }

    /** Normalize to unit vector (mutates) */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    /** Distance to another vector */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** Squared distance to another vector */
    distanceToSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /** Dot product */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /** Linear interpolation towards target */
    lerp(target, t) {
        this.x += (target.x - this.x) * t;
        this.y += (target.y - this.y) * t;
        return this;
    }

    /** Clamp both components to min/max */
    clamp(minX, minY, maxX, maxY) {
        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
        return this;
    }

    /** Check if approximately equal to another vector */
    equals(v, epsilon = 0.001) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }

    /** Return as plain object */
    toObject() {
        return { x: this.x, y: this.y };
    }

    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    // ---- Static factory methods ----

    static zero() {
        return new Vector2(0, 0);
    }

    static one() {
        return new Vector2(1, 1);
    }

    static up() {
        return new Vector2(0, -1);
    }

    static down() {
        return new Vector2(0, 1);
    }

    static left() {
        return new Vector2(-1, 0);
    }

    static right() {
        return new Vector2(1, 0);
    }

    /** Create from angle (radians) and magnitude */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /** Add two vectors (non-mutating) */
    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /** Subtract two vectors (non-mutating) */
    static sub(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    /** Scale a vector (non-mutating) */
    static scale(v, s) {
        return new Vector2(v.x * s, v.y * s);
    }

    /** Linearly interpolate between two vectors (non-mutating) */
    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }

    /** Distance between two vectors */
    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
