/**
 * CosmoDash — Constants
 * Global configuration values used across the entire game.
 */

export const GAME = {
    TITLE: 'CosmoDash',
    VERSION: '0.1.0',
    WIDTH: 960,
    HEIGHT: 540,
    TILE_SIZE: 32,
    FPS: 60,
    FIXED_TIMESTEP: 1000 / 60,   // ~16.67ms per tick
    MAX_DELTA: 1000 / 30,         // cap at 30fps equivalent to prevent spiral of death
};

export const PHYSICS = {
    GRAVITY: 0.6,                 // base gravity (pixels/frame²)
    MAX_FALL_SPEED: 12,           // terminal velocity
    FRICTION_GROUND: 0.85,        // ground friction multiplier
    FRICTION_AIR: 0.95,           // air friction multiplier
};

export const PLAYER = {
    // Movement
    RUN_ACCEL: 0.6,               // acceleration per frame
    RUN_MAX_SPEED: 5.5,           // max horizontal speed
    SPRINT_MAX_SPEED: 7.5,        // max speed while holding sprint

    // Jumping
    JUMP_FORCE: -11,              // initial jump velocity
    JUMP_CUT: 0.4,               // multiply Y vel when releasing jump early (variable height)
    DOUBLE_JUMP_FORCE: -9.5,     // double jump velocity
    WALL_JUMP_FORCE_X: 6,        // horizontal push on wall jump
    WALL_JUMP_FORCE_Y: -10,      // vertical push on wall jump
    WALL_SLIDE_SPEED: 2,         // max slide-down speed on wall

    // Dash
    DASH_SPEED: 14,              // dash velocity
    DASH_DURATION: 150,          // ms
    DASH_COOLDOWN: 800,          // ms

    // Timers
    COYOTE_TIME: 100,            // ms — can still jump after leaving edge
    JUMP_BUFFER_TIME: 120,       // ms — press jump slightly before landing

    // Health
    MAX_HEALTH: 3,
    INVINCIBILITY_DURATION: 1500, // ms after taking damage
    KNOCKBACK_FORCE_X: 4,
    KNOCKBACK_FORCE_Y: -6,

    // Size
    WIDTH: 24,
    HEIGHT: 32,
};

export const CAMERA = {
    LERP_SPEED: 0.08,            // smooth follow interpolation (0 = no move, 1 = instant)
    LOOKAHEAD_X: 60,             // pixels ahead of player in movement direction
    LOOKAHEAD_Y: 30,
    DEAD_ZONE_X: 20,             // pixels of dead zone before camera starts following
    DEAD_ZONE_Y: 15,
};

export const COLORS = {
    // Debug colors
    DEBUG_HITBOX: '#0f0',
    DEBUG_TILE_SOLID: 'rgba(255, 0, 0, 0.3)',
    DEBUG_TILE_PLATFORM: 'rgba(0, 255, 255, 0.3)',

    // Placeholder colors (before sprites exist)
    PLAYER: '#00d4ff',
    PLAYER_DASH: '#ffd700',
    ENEMY_GRUNT: '#ff3366',
    ENEMY_FLOATER: '#ff6b35',
    STAR_CORE: '#ffd700',
    TILE_GROUND: '#3a3a5c',
    TILE_PLATFORM: '#5c5c8a',
    TILE_HAZARD: '#ff3366',
    BACKGROUND: '#0a0a1a',
    SKY_GRADIENT_TOP: '#05050f',
    SKY_GRADIENT_BOTTOM: '#0d0d2b',
};

export const STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete',
    CUTSCENE: 'cutscene',
    WORLD_MAP: 'worldMap',
};

export const TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1,
    PLATFORM: 2,     // one-way (can jump through from below)
    HAZARD: 3,
    BREAKABLE: 4,
    BOUNCE: 5,
    QUESTION: 6,      // ? block
    LADDER: 7,
    TELEPORTER: 8,
};

export const KEYS = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    JUMP: ['Space'],
    DASH: ['ShiftLeft', 'ShiftRight'],
    PAUSE: ['Escape', 'KeyP'],
    DEBUG: ['Backquote'],          // ~ key
    CONFIRM: ['Enter', 'Space'],
};
