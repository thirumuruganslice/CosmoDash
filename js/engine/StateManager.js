/**
 * CosmoDash — StateManager
 * Finite state machine for managing game states (Menu, Playing, Paused, etc.).
 * Each state is an object with optional lifecycle hooks: enter(), exit(), update(), render().
 */

export class StateManager {
    constructor() {
        /** @type {Map<string, object>} Registered states */
        this._states = new Map();

        /** @type {string|null} Current active state key */
        this._currentKey = null;

        /** @type {object|null} Current active state object */
        this._current = null;

        /** @type {string|null} Previous state key (for returning) */
        this._previousKey = null;

        /** @type {Array} State transition history */
        this._history = [];

        /** @type {boolean} Whether a transition is in progress */
        this._transitioning = false;
    }

    /**
     * Register a state.
     * @param {string} key — unique identifier (use STATES constants)
     * @param {object} state — object with optional: enter(prevState), exit(nextState), update(dt), render(ctx)
     */
    register(key, state) {
        if (this._states.has(key)) {
            console.warn(`[StateManager] Overwriting existing state: "${key}"`);
        }
        this._states.set(key, state);
        return this;
    }

    /**
     * Switch to a new state.
     * Calls exit() on current state, then enter() on new state.
     * @param {string} key
     * @param {object} [data] — optional data to pass to the new state's enter()
     */
    switch(key, data = {}) {
        if (!this._states.has(key)) {
            console.error(`[StateManager] State "${key}" not registered.`);
            return;
        }

        if (this._transitioning) {
            console.warn(`[StateManager] Already transitioning, ignoring switch to "${key}".`);
            return;
        }

        this._transitioning = true;

        const prevKey = this._currentKey;
        const prevState = this._current;
        const nextState = this._states.get(key);

        // Exit current state
        if (prevState && typeof prevState.exit === 'function') {
            prevState.exit(key, data);
        }

        // Update history
        this._previousKey = prevKey;
        if (prevKey) {
            this._history.push(prevKey);
            if (this._history.length > 20) this._history.shift(); // cap history
        }

        // Enter new state
        this._currentKey = key;
        this._current = nextState;

        if (nextState && typeof nextState.enter === 'function') {
            nextState.enter(prevKey, data);
        }

        this._transitioning = false;

        console.log(`[StateManager] ${prevKey || '(none)'} → ${key}`);
    }

    /**
     * Return to the previous state.
     * @param {object} [data]
     */
    back(data = {}) {
        if (this._previousKey) {
            this.switch(this._previousKey, data);
        }
    }

    /**
     * Update the current state.
     * @param {number} dt — delta time in ms
     */
    update(dt) {
        if (this._current && typeof this._current.update === 'function') {
            this._current.update(dt);
        }
    }

    /**
     * Render the current state.
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (this._current && typeof this._current.render === 'function') {
            this._current.render(ctx);
        }
    }

    /** Get current state key */
    get currentKey() {
        return this._currentKey;
    }

    /** Get current state object */
    get current() {
        return this._current;
    }

    /** Check if a specific state is active */
    is(key) {
        return this._currentKey === key;
    }

    /** Get previous state key */
    get previousKey() {
        return this._previousKey;
    }
}
