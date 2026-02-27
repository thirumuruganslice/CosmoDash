/**
 * CosmoDash — InputManager
 * Handles keyboard input with press/release tracking, buffered actions, and gamepad stub.
 * Uses event.code for layout-independent key detection.
 */

import { KEYS } from '../utils/Constants.js';

export class InputManager {
    constructor() {
        /** @type {Set<string>} Currently held keys (event.code) */
        this._held = new Set();

        /** @type {Set<string>} Keys pressed this frame (just down) */
        this._justPressed = new Set();

        /** @type {Set<string>} Keys released this frame (just up) */
        this._justReleased = new Set();

        /** @type {Set<string>} Buffer for keys pressed between frames */
        this._pressBuffer = new Set();

        /** @type {Set<string>} Buffer for keys released between frames */
        this._releaseBuffer = new Set();

        /** @type {boolean} Whether input is enabled */
        this._enabled = true;

        /** @type {Gamepad|null} Connected gamepad (stub) */
        this._gamepad = null;

        // Bind event handlers
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onBlur = this._onBlur.bind(this);

        this._init();
    }

    /** Set up event listeners */
    _init() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('blur', this._onBlur);

        // Gamepad stub
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`[Input] Gamepad connected: ${e.gamepad.id}`);
            this._gamepad = e.gamepad;
        });
        window.addEventListener('gamepaddisconnected', () => {
            console.log('[Input] Gamepad disconnected');
            this._gamepad = null;
        });
    }

    /** @param {KeyboardEvent} e */
    _onKeyDown(e) {
        // Prevent default for game keys (don't scroll page, etc.)
        if (this._isGameKey(e.code)) {
            e.preventDefault();
        }

        if (!this._held.has(e.code)) {
            this._pressBuffer.add(e.code);
        }
        this._held.add(e.code);
    }

    /** @param {KeyboardEvent} e */
    _onKeyUp(e) {
        this._held.delete(e.code);
        this._releaseBuffer.add(e.code);
    }

    /** Clear all keys on window blur (prevent stuck keys) */
    _onBlur() {
        this._held.clear();
        this._pressBuffer.clear();
        this._releaseBuffer.clear();
    }

    /**
     * Call at the START of each frame to flush buffered inputs.
     * This moves press/release buffers into the per-frame sets.
     */
    update() {
        this._justPressed.clear();
        this._justReleased.clear();

        // Move buffers → per-frame sets
        for (const code of this._pressBuffer) {
            this._justPressed.add(code);
        }
        for (const code of this._releaseBuffer) {
            this._justReleased.add(code);
        }

        this._pressBuffer.clear();
        this._releaseBuffer.clear();
    }

    // ---- Query Methods ----

    /**
     * Check if an action is currently held.
     * @param {string[]} keyCodes — array of event.code values (from KEYS constants)
     */
    isHeld(keyCodes) {
        if (!this._enabled) return false;
        return keyCodes.some(code => this._held.has(code));
    }

    /**
     * Check if an action was just pressed this frame.
     * @param {string[]} keyCodes
     */
    isJustPressed(keyCodes) {
        if (!this._enabled) return false;
        return keyCodes.some(code => this._justPressed.has(code));
    }

    /**
     * Check if an action was just released this frame.
     * @param {string[]} keyCodes
     */
    isJustReleased(keyCodes) {
        if (!this._enabled) return false;
        return keyCodes.some(code => this._justReleased.has(code));
    }

    // ---- Convenience Methods (using KEYS constants) ----

    get left() { return this.isHeld(KEYS.LEFT); }
    get right() { return this.isHeld(KEYS.RIGHT); }
    get up() { return this.isHeld(KEYS.UP); }
    get down() { return this.isHeld(KEYS.DOWN); }
    get jump() { return this.isJustPressed(KEYS.JUMP); }
    get jumpHeld() { return this.isHeld(KEYS.JUMP); }
    get jumpReleased() { return this.isJustReleased(KEYS.JUMP); }
    get dash() { return this.isJustPressed(KEYS.DASH); }
    get pause() { return this.isJustPressed(KEYS.PAUSE); }
    get debug() { return this.isJustPressed(KEYS.DEBUG); }
    get confirm() { return this.isJustPressed(KEYS.CONFIRM); }

    /** Get horizontal axis: -1 (left), 0 (none), 1 (right) */
    get axisX() {
        let val = 0;
        if (this.left) val -= 1;
        if (this.right) val += 1;
        return val;
    }

    /** Get vertical axis: -1 (up), 0 (none), 1 (down) */
    get axisY() {
        let val = 0;
        if (this.up) val -= 1;
        if (this.down) val += 1;
        return val;
    }

    /** Check if a key code is used by the game (to prevent default) */
    _isGameKey(code) {
        const allKeys = [
            ...KEYS.LEFT, ...KEYS.RIGHT, ...KEYS.UP, ...KEYS.DOWN,
            ...KEYS.JUMP, ...KEYS.DASH, ...KEYS.PAUSE, ...KEYS.CONFIRM,
        ];
        return allKeys.includes(code);
    }

    /** Enable/disable input processing */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) {
            this._held.clear();
            this._justPressed.clear();
            this._justReleased.clear();
        }
    }

    /** Clean up event listeners */
    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('blur', this._onBlur);
    }
}
