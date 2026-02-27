/**
 * CosmoDash — AssetLoader
 * Preloads images and audio files with progress tracking.
 * Returns a promise that resolves when all assets are loaded.
 */

export class AssetLoader {
    constructor() {
        /** @type {Map<string, HTMLImageElement>} Loaded images */
        this.images = new Map();

        /** @type {Map<string, HTMLAudioElement>} Loaded audio */
        this.audio = new Map();

        /** @type {Map<string, object>} Loaded JSON data */
        this.data = new Map();

        /** @type {number} Total assets queued */
        this._totalAssets = 0;

        /** @type {number} Assets loaded so far */
        this._loadedAssets = 0;

        /** @type {Function|null} Progress callback (0-1) */
        this._onProgress = null;
    }

    /**
     * Set a progress callback.
     * @param {Function} callback — receives (progress: 0-1, loaded: number, total: number)
     */
    onProgress(callback) {
        this._onProgress = callback;
        return this;
    }

    /**
     * Queue and load multiple image assets.
     * @param {Object<string, string>} manifest — { key: 'path/to/image.png', ... }
     * @returns {Promise<void>}
     */
    async loadImages(manifest) {
        const entries = Object.entries(manifest);
        this._totalAssets += entries.length;

        const promises = entries.map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images.set(key, img);
                    this._assetLoaded();
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[AssetLoader] Failed to load image: "${key}" (${src})`);
                    this._assetLoaded(); // count as loaded to not block
                    resolve(); // resolve anyway
                };
                img.src = src;
            });
        });

        await Promise.all(promises);
    }

    /**
     * Queue and load multiple audio assets.
     * @param {Object<string, string>} manifest — { key: 'path/to/sound.mp3', ... }
     * @returns {Promise<void>}
     */
    async loadAudio(manifest) {
        const entries = Object.entries(manifest);
        this._totalAssets += entries.length;

        const promises = entries.map(([key, src]) => {
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.preload = 'auto';

                audio.addEventListener('canplaythrough', () => {
                    this.audio.set(key, audio);
                    this._assetLoaded();
                    resolve();
                }, { once: true });

                audio.addEventListener('error', () => {
                    console.warn(`[AssetLoader] Failed to load audio: "${key}" (${src})`);
                    this._assetLoaded();
                    resolve();
                }, { once: true });

                audio.src = src;
                audio.load();
            });
        });

        await Promise.all(promises);
    }

    /**
     * Load JSON data files.
     * @param {Object<string, string>} manifest — { key: 'path/to/data.json', ... }
     * @returns {Promise<void>}
     */
    async loadJSON(manifest) {
        const entries = Object.entries(manifest);
        this._totalAssets += entries.length;

        const promises = entries.map(async ([key, src]) => {
            try {
                const response = await fetch(src);
                const json = await response.json();
                this.data.set(key, json);
            } catch (err) {
                console.warn(`[AssetLoader] Failed to load JSON: "${key}" (${src})`, err);
            }
            this._assetLoaded();
        });

        await Promise.all(promises);
    }

    /** Increment loaded count and fire progress callback */
    _assetLoaded() {
        this._loadedAssets++;
        if (this._onProgress) {
            const progress = this._totalAssets > 0
                ? this._loadedAssets / this._totalAssets
                : 1;
            this._onProgress(progress, this._loadedAssets, this._totalAssets);
        }
    }

    /**
     * Get a loaded image by key.
     * @param {string} key
     * @returns {HTMLImageElement|undefined}
     */
    getImage(key) {
        return this.images.get(key);
    }

    /**
     * Get a loaded audio element by key.
     * @param {string} key
     * @returns {HTMLAudioElement|undefined}
     */
    getAudio(key) {
        return this.audio.get(key);
    }

    /**
     * Get loaded JSON data by key.
     * @param {string} key
     * @returns {object|undefined}
     */
    getData(key) {
        return this.data.get(key);
    }

    /** Get loading progress (0-1) */
    get progress() {
        return this._totalAssets > 0
            ? this._loadedAssets / this._totalAssets
            : 1;
    }

    /** Check if all queued assets are loaded */
    get isComplete() {
        return this._loadedAssets >= this._totalAssets;
    }

    /** Reset the loader (for loading new level assets) */
    reset() {
        this._totalAssets = 0;
        this._loadedAssets = 0;
    }
}
