/**
 * CosmoDash — Game (Phase 2 Refactor)
 * Main game class with fixed-timestep loop, state management,
 * and proper Entity/Physics/Collision architecture.
 */

import { GAME, STATES, COLORS, PLAYER, COLLISION_LAYERS, SCROLL, DIFFICULTY } from '../utils/Constants.js';
import { StateManager } from './StateManager.js';
import { InputManager } from './InputManager.js';
import { AssetLoader } from './AssetLoader.js';
import { Camera } from './Camera.js';
import { Entity } from './Entity.js';
import { PhysicsBody } from './PhysicsBody.js';
import { CollisionManager } from './CollisionManager.js';
import { EntityManager } from './EntityManager.js';
import { TileMap } from './TileMap.js';
import { NovaRiderRenderer, NovaRiderAnimController, loadSpriteSheet } from './NovaRiderRenderer.js';
import { SpaceBG } from '../SpaceBackground.js';


// ─────────────────────────────────────────────
// Player Entity
// ─────────────────────────────────────────────

class PlayerEntity extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER.WIDTH, PLAYER.HEIGHT);
        this.tag = 'player';
        this.collisionLayer = COLLISION_LAYERS.PLAYER;
        this.collisionMask = COLLISION_LAYERS.GROUND | COLLISION_LAYERS.OBSTACLE | COLLISION_LAYERS.COLLECTIBLE;

        // Jump state
        this.jumps = 0;
        this.maxJumps = PLAYER.MAX_JUMPS;

        // Dash state
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;

        // Coyote time — allows jumping briefly after walking off an edge
        this.coyoteTimer = 0;
        this.wasGrounded = false;

        // Jump buffering — remembers a jump press slightly before landing
        this.jumpBufferTimer = 0;

        // Stats
        this.starsCollected = 0;
        this.distanceTraveled = 0;

        // Nova Rider animation controller
        this._animController = new NovaRiderAnimController();
    }

    /**
     * Update player movement, dash, jump (with coyote time & buffer).
     * Physics (gravity, friction, integration) is handled externally by PhysicsBody.
     * Collision is handled externally by CollisionManager.
     */
    updateMovement(dt, input) {
        const dtScale = dt / 16.67;

        // ── Dash ──
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= dt;
        }

        if (input.dash && !this.isDashing && this.dashCooldownTimer <= 0) {
            this.isDashing = true;
            this.dashTimer = PLAYER.DASH_DURATION;
            this.dashCooldownTimer = PLAYER.DASH_COOLDOWN;
            this.vx = this.facingRight ? PLAYER.DASH_SPEED : -PLAYER.DASH_SPEED;
            this.vy = 0;
        }

        // ── Horizontal movement (skip during dash) ──
        if (!this.isDashing) {
            const accel = PLAYER.RUN_ACCEL * dtScale;
            const maxSpeed = PLAYER.RUN_MAX_SPEED;

            if (input.left) {
                this.vx -= accel;
                this.facingRight = false;
            } else if (input.right) {
                this.vx += accel;
                this.facingRight = true;
            }
            // Friction is applied by PhysicsBody

            this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
        }

        // ── Coyote time ──
        if (this.wasGrounded && !this.isGrounded) {
            // Just left the ground — start coyote timer
            this.coyoteTimer = PLAYER.COYOTE_TIME;
        }
        if (this.coyoteTimer > 0) {
            this.coyoteTimer -= dt;
        }
        this.wasGrounded = this.isGrounded;

        // ── Jump buffering ──
        if (input.jump) {
            this.jumpBufferTimer = PLAYER.JUMP_BUFFER_TIME;
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= dt;
        }

        // ── Jump execution ──
        const canCoyoteJump = this.coyoteTimer > 0 && this.jumps === 0;
        const wantsToJump = input.jump || this.jumpBufferTimer > 0;

        if (wantsToJump) {
            if (this.isGrounded || canCoyoteJump) {
                this.vy = PLAYER.JUMP_FORCE;
                this.isGrounded = false;
                this.jumps = 1;
                this.coyoteTimer = 0;
                this.jumpBufferTimer = 0;
            } else if (this.jumps > 0 && this.jumps < this.maxJumps) {
                this.vy = PLAYER.DOUBLE_JUMP_FORCE;
                this.jumps++;
                this.jumpBufferTimer = 0;
            }
        }

        // ── Variable jump height (release to cut) ──
        if (input.jumpReleased && this.vy < 0) {
            this.vy *= PLAYER.JUMP_CUT;
        }

        // ── Disable gravity during dash ──
        this.gravityScale = this.isDashing ? 0 : 1.0;

        // ── Reset jumps when grounded ──
        if (this.isGrounded) {
            this.jumps = 0;
        }
    }

    render(ctx, camera) {
        if (!this.isActive) return;

        // Draw Nova Rider character
        NovaRiderRenderer.draw(
            ctx,
            this.x, this.y,
            this.width, this.height,
            this.facingRight,
            this._animController,
            {
                isDashing: this.isDashing,
                dashCooldownTimer: this.dashCooldownTimer,
                dashCooldownMax: PLAYER.DASH_COOLDOWN,
            }
        );

        // Dash cooldown indicator (small bar under player)
        if (this.dashCooldownTimer > 0) {
            const cooldownPct = 1 - (this.dashCooldownTimer / PLAYER.DASH_COOLDOWN);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.fillRect(this.x, this.y + this.height + 3, this.width * cooldownPct, 2);
        }
    }

    renderDebug(ctx, color) {
        super.renderDebug(ctx, '#0f0');
        // Show coyote/buffer indicators
        if (this.coyoteTimer > 0) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.fillRect(this.x, this.y - 4, this.width * (this.coyoteTimer / PLAYER.COYOTE_TIME), 2);
        }
        if (this.jumpBufferTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(this.x, this.y - 7, this.width * (this.jumpBufferTimer / PLAYER.JUMP_BUFFER_TIME), 2);
        }
    }

    onTriggerEnter(other) {
        if (other.tag === 'star') {
            this.starsCollected++;
        }
    }

    reset(x = 100, y = 0) {
        super.reset(x, y);
        this.jumps = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.wasGrounded = false;
        this.starsCollected = 0;
        this.distanceTraveled = 0;
    }
}

// ─────────────────────────────────────────────
// Game Class
// ─────────────────────────────────────────────

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Core engine systems
        this.states = new StateManager();
        this.input = new InputManager();
        this.assets = new AssetLoader();
        this.camera = new Camera();

        // Phase 2 systems
        this.physics = new PhysicsBody();
        this.collisions = new CollisionManager();
        this.entities = new EntityManager();
        this.tilemap = new TileMap();

        // Animated space background (renders directly to game canvas)
        this.spaceBG = new SpaceBG(GAME.WIDTH, GAME.HEIGHT);

        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;

        // Frame timing
        this._lastTime = 0;
        this._accumulator = 0;
        this._frameCount = 0;
        this._fpsTime = 0;
        this._fps = 0;
        this._running = false;
        this._rafId = null;

        // Debug
        this.debug = false;
        this._fpsElement = document.getElementById('fps-counter');

        // Scaling
        this._scale = 1;
        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
        this._onResize();

        this._init();
    }

    async _init() {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingScreen = document.getElementById('loading-screen');

        this.assets.onProgress((progress, loaded, total) => {
            if (loadingBar) loadingBar.style.width = `${progress * 100}%`;
            if (loadingText) loadingText.textContent = `Loading assets... ${loaded}/${total}`;
        });

        await this._simulateLoading(loadingBar, loadingText);

        // Load the character spritesheet
        try {
            await loadSpriteSheet();
        } catch (e) {
            console.warn('[Game] Spritesheet load failed, character will be invisible:', e);
        }

        this._registerStates();

        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);
        }

        this.states.switch(STATES.MENU);

        this._running = true;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame((t) => this._loop(t));
    }

    async _simulateLoading(bar, text) {
        const steps = ['Powering engines...', 'Calibrating thrusters...', 'Scanning star maps...', 'Ready for launch!'];
        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 250));
            if (bar) bar.style.width = `${((i + 1) / steps.length) * 100}%`;
            if (text) text.textContent = steps[i];
        }
        await new Promise(r => setTimeout(r, 300));
    }

    // ═══════════════════════════════════════════
    // State Registration
    // ═══════════════════════════════════════════

    _registerStates() {
        const game = this;

        // ── MENU STATE ──
        this.states.register(STATES.MENU, {
            _titleAlpha: 0,
            _promptTimer: 0,

            enter() {
                this._titleAlpha = 0;
                this._promptTimer = 0;
            },

            update(dt) {
                // Title fade in
                if (this._titleAlpha < 1) {
                    this._titleAlpha = Math.min(1, this._titleAlpha + 0.02);
                }
                this._promptTimer += dt;

                if (game.input.confirm) {
                    game.states.switch(STATES.PLAYING);
                }

                if (game.input.debug) {
                    game.debug = !game.debug;
                    game._fpsElement?.classList.toggle('visible', game.debug);
                }
            },

            render(ctx) {
                // Animated space background
                game.spaceBG.draw(ctx);

                // Title
                ctx.save();
                ctx.globalAlpha = this._titleAlpha;
                ctx.font = '32px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Title glow
                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#00d4ff';
                ctx.fillText('COSMODASH', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60);

                // Subtitle
                ctx.shadowBlur = 0;
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#aaa';
                ctx.fillText("Nova Ryder's Cosmic Dash", GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);
                ctx.restore();

                // Blinking prompt
                const show = Math.sin(this._promptTimer / 400) > 0;
                if (show) {
                    ctx.font = '12px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffd700';
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 10;
                    ctx.fillText('PRESS ENTER TO START', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 60);
                    ctx.shadowBlur = 0;
                }

                // Controls hint
                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText('ARROWS / WASD = Move   SPACE = Jump   SHIFT = Dash', GAME.WIDTH / 2, GAME.HEIGHT - 30);

                // Version
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`v${GAME.VERSION}`, GAME.WIDTH / 2, GAME.HEIGHT - 12);
            }
        });

        // ── PLAYING STATE (Phase 3: Endless Runner Core) ──
        this.states.register(STATES.PLAYING, {
            _player: null,

            // ── Auto-scroll state ──
            _scrollSpeed: 0,
            _scrollDistance: 0,       // total pixels scrolled (for scoring)
            _timePlayed: 0,            // total ms since run started
            _score: 0,
            _highScore: 0,

            // ── Difficulty ──
            _difficulty: 0,

            // ── Visual feedback ──
            _speedLines: [],           // speed line particles

            enter(prevState, data) {
                // If resuming from pause, skip full reset
                if (prevState === STATES.PAUSED) return;

                // Reset systems
                game.entities.clear();
                game.tilemap.clear();

                // Create player — placed on ground
                const groundY = GAME.HEIGHT - GAME.GROUND_HEIGHT;
                this._player = new PlayerEntity(200, groundY - PLAYER.HEIGHT);
                game.entities.add(this._player);

                // Initialize tilemap
                game.tilemap.init(game.entities);

                // Set camera
                game.camera.setWorldBounds(GAME.WIDTH * 1000, GAME.HEIGHT);
                game.camera.centerOn(this._player.centerX, this._player.centerY);

                // Reset run state
                this._scrollSpeed = SCROLL.BASE_SPEED;
                this._scrollDistance = 0;
                this._timePlayed = 0;
                this._score = 0;
                this._difficulty = 0;
                this._speedLines = [];

                // Load high score from localStorage
                try {
                    this._highScore = parseInt(localStorage.getItem('cosmodash_highscore') || '0', 10);
                } catch { this._highScore = 0; }

            },

            update(dt) {
                const input = game.input;

                // Pause
                if (input.pause) {
                    game.states.switch(STATES.PAUSED);
                    return;
                }

                // Debug toggle
                if (input.debug) {
                    game.debug = !game.debug;
                    game._fpsElement?.classList.toggle('visible', game.debug);
                }

                const player = this._player;

                // ── Timer ──
                this._timePlayed += dt;

                // ── Auto-scroll: accelerate over time ──
                this._scrollSpeed = Math.min(
                    SCROLL.MAX_SPEED,
                    SCROLL.BASE_SPEED + this._timePlayed * SCROLL.ACCELERATION
                );

                // ── Push the player forward with scroll speed ──
                const dtScale = dt / 16.67;
                player.position.x += this._scrollSpeed * dtScale;

                // Track scroll distance for scoring
                this._scrollDistance += this._scrollSpeed * dtScale;

                // ── Distance score: 1 point per 10px ──
                this._score = Math.floor(this._scrollDistance / 10) + player.starsCollected * 50;

                // ── Difficulty ──
                this._difficulty = game.tilemap.getDifficulty(player.x);

                // ── Player movement (on top of auto-scroll) ──
                player.updateMovement(dt, input);

                // ── Update Nova Rider animation ──
                player._animController.update(dt, player);

                // ── Physics step ──
                game.physics.step(player, dt);

                // ── Collision ──
                const statics = game.entities.getByTag('ground').concat(game.entities.getByTag('platform'));
                game.collisions.resolveAgainstStatics(player, statics);

                const triggers = game.entities.getByTag('star');
                game.collisions.checkTriggers(player, triggers);

                // ── Prevent moving left past camera (endless runner wall) ──
                const cameraLeft = game.camera.position.x;
                if (player.x < cameraLeft + 10) {
                    player.x = cameraLeft + 10;
                    player.vx = Math.max(0, player.vx);
                }

                // ── Ceiling clamp ──
                if (player.y < 0) { player.y = 0; player.vy = 0; }

                // ── Fall death (into gap or off-screen) ──
                if (player.y > GAME.HEIGHT + 60) {
                    // Save high score
                    if (this._score > this._highScore) {
                        this._highScore = this._score;
                        try { localStorage.setItem('cosmodash_highscore', String(this._score)); } catch { }
                    }
                    game.camera.shake(8, 300);
                    game.states.switch(STATES.GAME_OVER);
                    return;
                }

                // ── Left-edge death (pushed off screen by auto-scroll) ──
                if (player.right < cameraLeft - 20) {
                    if (this._score > this._highScore) {
                        this._highScore = this._score;
                        try { localStorage.setItem('cosmodash_highscore', String(this._score)); } catch { }
                    }
                    game.states.switch(STATES.GAME_OVER);
                    return;
                }

                // ── Update entities ──
                game.entities.update(dt, game);

                // ── Update tilemap ──
                game.tilemap.update(game.camera.position.x);

                // ── Speed lines (visual feedback for speed) ──
                if (this._scrollSpeed > 4 && Math.random() < 0.3) {
                    this._speedLines.push({
                        x: GAME.WIDTH + 10,
                        y: Math.random() * GAME.HEIGHT,
                        len: 20 + Math.random() * 40,
                        speed: this._scrollSpeed * 3 + Math.random() * 5,
                        alpha: 0.15 + Math.random() * 0.15,
                    });
                }
                for (let i = this._speedLines.length - 1; i >= 0; i--) {
                    const line = this._speedLines[i];
                    line.x -= line.speed * dtScale;
                    if (line.x + line.len < 0) this._speedLines.splice(i, 1);
                }

                // ── Camera follow (offset right to show more ahead) ──
                game.camera.follow(
                    player.centerX + 100,   // offset ahead for endless runner feel
                    GAME.HEIGHT / 2,         // lock camera Y to middle
                    1                        // always looking right
                );
                game.camera.update(dt);
            },

            render(ctx) {
                const cam = game.camera;
                const player = this._player;

                // ── Animated space background ──
                game.spaceBG.draw(ctx);

                // Speed lines (screen space)
                for (const line of this._speedLines) {
                    ctx.strokeStyle = `rgba(150, 200, 255, ${line.alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(line.x, line.y);
                    ctx.lineTo(line.x + line.len, line.y);
                    ctx.stroke();
                }

                // ── World-space rendering ──
                ctx.save();
                ctx.translate(cam.offsetX, cam.offsetY);

                game.entities.render(ctx, cam);

                if (game.debug) {
                    game.entities.renderDebug(ctx, cam);
                }

                ctx.restore();

                // ── HUD ──
                // Score
                ctx.font = '12px "Press Start 2P"';
                ctx.textAlign = 'right';
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 8;
                ctx.fillText(`${this._score}`, GAME.WIDTH - 16, 28);
                ctx.shadowBlur = 0;

                // High score
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillText(`HI ${this._highScore}`, GAME.WIDTH - 16, 44);

                // Star counter
                ctx.font = '10px "Press Start 2P"';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
                ctx.fillText(`★ ${player.starsCollected}`, 16, 28);
                ctx.shadowBlur = 0;

                // Distance
                ctx.font = '8px "Press Start 2P"';
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillText(`${Math.floor(this._scrollDistance / 10)}m`, 16, 44);

                // Speed indicator
                const speedPct = this._scrollSpeed / SCROLL.MAX_SPEED;
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(16, 52, 60, 4);
                const speedColor = speedPct > 0.7 ? '#ff3366' : speedPct > 0.4 ? '#ffd700' : '#00d4ff';
                ctx.fillStyle = speedColor;
                ctx.fillRect(16, 52, 60 * speedPct, 4);

                // Dash cooldown
                if (player.dashCooldownTimer > 0) {
                    const pct = 1 - (player.dashCooldownTimer / PLAYER.DASH_COOLDOWN);
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(16, 60, 60, 4);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(16, 60, 60 * pct, 4);
                } else {
                    ctx.font = '7px "Press Start 2P"';
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                    ctx.fillText('DASH ▸', 16, 66);
                }

                // Debug info
                if (game.debug) {
                    ctx.font = '8px "Press Start 2P"';
                    ctx.fillStyle = '#0f0';
                    ctx.textAlign = 'left';
                    const dy = GAME.HEIGHT - 8;
                    ctx.fillText(`SPD: ${this._scrollSpeed.toFixed(2)}  DIFF: ${(this._difficulty * 100).toFixed(0)}%  SEED: ${game.tilemap.seed}`, 16, dy - 48);
                    ctx.fillText(`POS: ${player.x.toFixed(0)}, ${player.y.toFixed(0)}  VEL: ${player.vx.toFixed(1)}, ${player.vy.toFixed(1)}`, 16, dy - 36);
                    ctx.fillText(`GND: ${player.isGrounded}  JUMPS: ${player.jumps}  DASH: ${player.isDashing}`, 16, dy - 24);
                    ctx.fillText(`COYOTE: ${player.coyoteTimer.toFixed(0)}ms  BUFFER: ${player.jumpBufferTimer.toFixed(0)}ms`, 16, dy - 12);
                    ctx.fillText(`ENTITIES: ${game.entities.count}  CHUNKS: ${game.tilemap._chunks.size}`, 16, dy);
                }

                // Controls hint (fades out after 5 seconds)
                const hintAlpha = Math.max(0, 1 - this._timePlayed / 5000);
                if (hintAlpha > 0) {
                    ctx.font = '8px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(255,255,255,${hintAlpha * 0.4})`;
                    ctx.fillText('SPACE = Jump   SHIFT = Dash   ESC = Pause', GAME.WIDTH / 2, GAME.HEIGHT - 16);
                }
            }
        });

        // ── PAUSED STATE ──
        this.states.register(STATES.PAUSED, {
            _overlayAlpha: 0,

            enter() {
                this._overlayAlpha = 0;
            },

            update(dt) {
                // Animate overlay
                if (this._overlayAlpha < 0.6) {
                    this._overlayAlpha = Math.min(0.6, this._overlayAlpha + 0.04);
                }

                if (game.input.pause || game.input.confirm) {
                    game.states.switch(STATES.PLAYING);
                }
            },

            render(ctx) {
                // Render the playing state underneath
                const playingState = game.states._states.get(STATES.PLAYING);
                if (playingState) playingState.render(ctx);

                // Dark overlay
                ctx.fillStyle = `rgba(0, 0, 0, ${this._overlayAlpha})`;
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                // Pause title
                ctx.font = '24px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#ffffff';
                ctx.fillText('PAUSED', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);
                ctx.shadowBlur = 0;

                // Resume prompt
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#aaa';
                ctx.fillText('Press ESC or ENTER to resume', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20);

                // Divider line
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(GAME.WIDTH / 2 - 120, GAME.HEIGHT / 2 + 45);
                ctx.lineTo(GAME.WIDTH / 2 + 120, GAME.HEIGHT / 2 + 45);
                ctx.stroke();

                // Controls reminder
                ctx.font = '8px "Press Start 2P"';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText('ARROWS = Move   SPACE = Jump   SHIFT = Dash', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 65);
            }
        });

        // ── GAME OVER STATE ──
        this.states.register(STATES.GAME_OVER, {
            _fadeAlpha: 0,
            _stats: null,
            _isNewHighScore: false,

            enter() {
                this._fadeAlpha = 0;
                const playingState = game.states._states.get(STATES.PLAYING);
                const player = playingState?._player;
                const score = playingState?._score || 0;
                const highScore = playingState?._highScore || 0;

                this._stats = {
                    score,
                    distance: Math.floor((playingState?._scrollDistance || 0) / 10),
                    stars: player ? player.starsCollected : 0,
                    highScore,
                };
                this._isNewHighScore = score >= highScore && score > 0;
            },

            update(dt) {
                if (this._fadeAlpha < 1) {
                    this._fadeAlpha = Math.min(1, this._fadeAlpha + 0.03);
                }
                if (game.input.confirm && this._fadeAlpha >= 0.8) {
                    game.states.switch(STATES.MENU);
                }
            },

            render(ctx) {
                // Animated space background
                game.spaceBG.draw(ctx);

                ctx.fillStyle = `rgba(5, 2, 15, ${this._fadeAlpha * 0.85})`;
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                if (this._fadeAlpha < 0.3) return;

                const alpha = Math.min(1, (this._fadeAlpha - 0.3) / 0.7);
                ctx.globalAlpha = alpha;

                // Game Over title
                ctx.font = '28px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#ff3366';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#ff3366';
                ctx.fillText('GAME OVER', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 70);
                ctx.shadowBlur = 0;

                if (this._stats) {
                    // Score (big)
                    ctx.font = '18px "Press Start 2P"';
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 10;
                    ctx.fillText(`${this._stats.score}`, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 25);
                    ctx.shadowBlur = 0;

                    // New high score badge
                    if (this._isNewHighScore) {
                        const flash = Math.sin(performance.now() / 200) > 0;
                        ctx.font = '8px "Press Start 2P"';
                        ctx.fillStyle = flash ? '#ffd700' : '#ff6b35';
                        ctx.fillText('★ NEW HIGH SCORE ★', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 5);
                    }

                    // Stats row
                    ctx.font = '9px "Press Start 2P"';
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.fillText(`${this._stats.distance}m   ★ ${this._stats.stars}`, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 15);

                    // High score
                    ctx.font = '8px "Press Start 2P"';
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillText(`BEST: ${this._stats.highScore}`, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 35);
                }

                // Divider
                ctx.strokeStyle = 'rgba(255, 51, 102, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(GAME.WIDTH / 2 - 100, GAME.HEIGHT / 2 + 50);
                ctx.lineTo(GAME.WIDTH / 2 + 100, GAME.HEIGHT / 2 + 50);
                ctx.stroke();

                // Continue prompt
                const show = Math.sin(performance.now() / 400) > 0;
                if (show) {
                    ctx.font = '10px "Press Start 2P"';
                    ctx.fillStyle = '#aaa';
                    ctx.fillText('Press ENTER to continue', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 75);
                }

                ctx.globalAlpha = 1;
            }
        });
    }

    // ═══════════════════════════════════════════
    // Game Loop
    // ═══════════════════════════════════════════

    _loop(timestamp) {
        if (!this._running) return;

        const dt = Math.min(timestamp - this._lastTime, GAME.MAX_DELTA);
        this._lastTime = timestamp;

        this._frameCount++;
        this._fpsTime += dt;
        if (this._fpsTime >= 1000) {
            this._fps = this._frameCount;
            this._frameCount = 0;
            this._fpsTime = 0;
            if (this._fpsElement && this.debug) {
                this._fpsElement.textContent = `FPS: ${this._fps}`;
            }
        }

        this.input.update();

        // Update space background animation
        this.spaceBG.update();

        this._accumulator += dt;
        while (this._accumulator >= GAME.FIXED_TIMESTEP) {
            this.states.update(GAME.FIXED_TIMESTEP);
            this._accumulator -= GAME.FIXED_TIMESTEP;
        }

        this._render();
        this._rafId = requestAnimationFrame((t) => this._loop(t));
    }

    _render() {
        const ctx = this.ctx;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
        this.states.render(ctx);
    }

    // ═══════════════════════════════════════════
    // Responsive Scaling
    // ═══════════════════════════════════════════

    _onResize() {
        // Fill the entire viewport — no gaps
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this._scale = Math.max(window.innerWidth / GAME.WIDTH, window.innerHeight / GAME.HEIGHT);
    }
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
const game = new Game();
window.__COSMODASH__ = game;
