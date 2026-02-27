import { GAME, STATES, COLORS } from '../utils/Constants.js';
import { StateManager } from './StateManager.js';
import { InputManager } from './InputManager.js';
import { AssetLoader } from './AssetLoader.js';
import { Camera } from './Camera.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.states = new StateManager();
        this.input = new InputManager();
        this.assets = new AssetLoader();
        this.camera = new Camera();

        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;

        this._lastTime = 0;
        this._accumulator = 0;
        this._frameCount = 0;
        this._fpsTime = 0;
        this._fps = 0;
        this._running = false;
        this._rafId = null;

        this.debug = false;
        this._fpsElement = document.getElementById('fps-counter');

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

    _registerStates() {
        const game = this;

        this.states.register(STATES.MENU, {
            _starfield: [],
            _titleAlpha: 0,
            _promptTimer: 0,

            enter() {
                this._starfield = [];
                for (let i = 0; i < 200; i++) {
                    this._starfield.push({
                        x: Math.random() * GAME.WIDTH,
                        y: Math.random() * GAME.HEIGHT,
                        size: Math.random() * 2 + 0.5,
                        speed: Math.random() * 0.3 + 0.05,
                        brightness: Math.random() * 0.5 + 0.5,
                    });
                }
                this._titleAlpha = 0;
                this._promptTimer = 0;
            },

            update(dt) {
                for (const star of this._starfield) {
                    star.y += star.speed * (dt / 16);
                    if (star.y > GAME.HEIGHT) {
                        star.y = -2;
                        star.x = Math.random() * GAME.WIDTH;
                    }
                }

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
                const grad = ctx.createLinearGradient(0, 0, 0, GAME.HEIGHT);
                grad.addColorStop(0, COLORS.SKY_GRADIENT_TOP);
                grad.addColorStop(1, COLORS.SKY_GRADIENT_BOTTOM);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                for (const star of this._starfield) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                    ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
                }

                ctx.save();
                ctx.globalAlpha = this._titleAlpha;
                ctx.font = '32px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#00d4ff';
                ctx.fillText('COSMODASH', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60);

                ctx.shadowBlur = 0;
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#aaa';
                ctx.fillText("Nova Ryder's Space Adventure", GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);

                ctx.restore();

                const show = Math.sin(this._promptTimer / 400) > 0;
                if (show) {
                    ctx.font = '12px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffd700';
                    ctx.fillText('PRESS ENTER TO START', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 60);
                }

                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText('ARROWS / WASD = Move   SPACE = Jump   SHIFT = Dash', GAME.WIDTH / 2, GAME.HEIGHT - 20);
            }
        });

        this.states.register(STATES.PLAYING, {
            _player: null,
            _ground: GAME.HEIGHT - 64,
            _platforms: [],
            _stars: [],

            enter() {
                this._player = {
                    x: 100,
                    y: 0,
                    width: 24,
                    height: 32,
                    vx: 0,
                    vy: 0,
                    onGround: false,
                    facingRight: true,
                    jumps: 0,
                    maxJumps: 2,
                    dashTimer: 0,
                    isDashing: false,
                };
                this._player.y = this._ground - this._player.height;

                this._platforms = [
                    { x: 250, y: this._ground - 80, w: 128, h: 16 },
                    { x: 450, y: this._ground - 150, w: 96, h: 16 },
                    { x: 650, y: this._ground - 100, w: 160, h: 16 },
                    { x: 100, y: this._ground - 200, w: 80, h: 16 },
                    { x: 350, y: this._ground - 250, w: 128, h: 16 },
                ];

                this._stars = [];
                for (const plat of this._platforms) {
                    this._stars.push({
                        x: plat.x + plat.w / 2 - 8,
                        y: plat.y - 24,
                        w: 16, h: 16,
                        collected: false,
                        bobTimer: Math.random() * Math.PI * 2,
                    });
                }

                game.camera.setWorldBounds(GAME.WIDTH, GAME.HEIGHT);
            },

            update(dt) {
                const p = this._player;
                const input = game.input;
                const dtScale = dt / 16.67;

                if (input.pause) {
                    game.states.switch(STATES.PAUSED);
                    return;
                }

                if (input.debug) {
                    game.debug = !game.debug;
                    game._fpsElement?.classList.toggle('visible', game.debug);
                }
                if (p.dashTimer > 0) {
                    p.dashTimer -= dt;
                    if (p.dashTimer <= 0) {
                        p.isDashing = false;
                    }
                }

                if (input.dash && !p.isDashing && p.dashTimer <= 0) {
                    p.isDashing = true;
                    p.dashTimer = 150;
                    p.vx = p.facingRight ? 14 : -14;
                    p.vy = 0;
                }

                if (!p.isDashing) {
                    const accel = 0.6 * dtScale;
                    const maxSpeed = 5.5;

                    if (input.left) {
                        p.vx -= accel;
                        p.facingRight = false;
                    } else if (input.right) {
                        p.vx += accel;
                        p.facingRight = true;
                    } else {
                        p.vx *= p.onGround ? 0.8 : 0.92;
                        if (Math.abs(p.vx) < 0.1) p.vx = 0;
                    }

                    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
                }

                if (input.jump) {
                    if (p.onGround) {
                        p.vy = -11;
                        p.onGround = false;
                        p.jumps = 1;
                    } else if (p.jumps < p.maxJumps) {
                        p.vy = -9.5;
                        p.jumps++;
                    }
                }

                if (input.jumpReleased && p.vy < 0) {
                    p.vy *= 0.45;
                }

                if (!p.isDashing) {
                    p.vy += 0.6 * dtScale;
                    if (p.vy > 12) p.vy = 12;
                }

                p.x += p.vx * dtScale;
                p.y += p.vy * dtScale;

                p.onGround = false;
                if (p.y + p.height >= this._ground) {
                    p.y = this._ground - p.height;
                    p.vy = 0;
                    p.onGround = true;
                    p.jumps = 0;
                }

                for (const plat of this._platforms) {
                    if (
                        p.vy >= 0 &&
                        p.x + p.width > plat.x &&
                        p.x < plat.x + plat.w &&
                        p.y + p.height >= plat.y &&
                        p.y + p.height <= plat.y + plat.h + p.vy * dtScale + 4
                    ) {
                        p.y = plat.y - p.height;
                        p.vy = 0;
                        p.onGround = true;
                        p.jumps = 0;
                    }
                }

                if (p.x < 0) { p.x = 0; p.vx = 0; }
                if (p.x + p.width > GAME.WIDTH) { p.x = GAME.WIDTH - p.width; p.vx = 0; }
                if (p.y < 0) { p.y = 0; p.vy = 0; }

                for (const star of this._stars) {
                    if (star.collected) continue;
                    star.bobTimer += dt / 400;
                    if (
                        p.x + p.width > star.x &&
                        p.x < star.x + star.w &&
                        p.y + p.height > star.y &&
                        p.y < star.y + star.h
                    ) {
                        star.collected = true;
                    }
                }

                game.camera.follow(
                    p.x + p.width / 2,
                    p.y + p.height / 2,
                    p.facingRight ? 1 : -1
                );
                game.camera.update(dt);
            },

            render(ctx) {
                const cam = game.camera;

                const grad = ctx.createLinearGradient(0, 0, 0, GAME.HEIGHT);
                grad.addColorStop(0, '#05050f');
                grad.addColorStop(0.7, '#0d0d2b');
                grad.addColorStop(1, '#1a0a2e');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                for (let i = 0; i < 60; i++) {
                    const sx = ((i * 137 + 47) % GAME.WIDTH);
                    const sy = ((i * 89 + 23) % (GAME.HEIGHT - 100));
                    ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
                }

                ctx.save();
                ctx.translate(cam.offsetX, cam.offsetY);

                ctx.fillStyle = COLORS.TILE_GROUND;
                ctx.fillRect(0, this._ground, GAME.WIDTH, 64);

                ctx.fillStyle = '#4a4a7a';
                ctx.fillRect(0, this._ground, GAME.WIDTH, 2);

                for (const plat of this._platforms) {
                    ctx.fillStyle = COLORS.TILE_PLATFORM;
                    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                    ctx.fillStyle = '#7a7aaa';
                    ctx.fillRect(plat.x, plat.y, plat.w, 2);
                }

                for (const star of this._stars) {
                    if (star.collected) continue;
                    const bobY = Math.sin(star.bobTimer) * 4;
                    ctx.fillStyle = COLORS.STAR_CORE;
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 8;
                    const cx = star.x + star.w / 2;
                    const cy = star.y + star.h / 2 + bobY;
                    this._drawStar(ctx, cx, cy, 5, 8, 4);
                    ctx.shadowBlur = 0;
                }

                const p = this._player;
                ctx.fillStyle = p.isDashing ? COLORS.PLAYER_DASH : COLORS.PLAYER;

                if (p.isDashing) {
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 15;
                }

                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#ffffff';
                const visorX = p.facingRight ? p.x + p.width - 10 : p.x + 2;
                ctx.fillRect(visorX, p.y + 8, 8, 4);

                ctx.fillStyle = '#ff6b35';
                const jetpackX = p.facingRight ? p.x : p.x + p.width - 4;
                ctx.fillRect(jetpackX, p.y + 12, 4, 12);

                if (game.debug) {
                    ctx.strokeStyle = COLORS.DEBUG_HITBOX;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(p.x, p.y, p.width, p.height);

                    for (const plat of this._platforms) {
                        ctx.strokeStyle = COLORS.DEBUG_TILE_PLATFORM;
                        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                    }
                }

                ctx.restore();

                ctx.font = '10px "Press Start 2P"';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffd700';
                const collected = this._stars.filter(s => s.collected).length;
                ctx.fillText(`★ ${collected}/${this._stars.length}`, 16, 28);

                if (game.debug) {
                    ctx.font = '8px "Press Start 2P"';
                    ctx.fillStyle = '#0f0';
                    ctx.fillText(`POS: ${p.x.toFixed(0)}, ${p.y.toFixed(0)}`, 16, GAME.HEIGHT - 40);
                    ctx.fillText(`VEL: ${p.vx.toFixed(1)}, ${p.vy.toFixed(1)}`, 16, GAME.HEIGHT - 28);
                    ctx.fillText(`GROUND: ${p.onGround}  JUMPS: ${p.jumps}`, 16, GAME.HEIGHT - 16);
                }

                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillText('ESC = Pause', GAME.WIDTH - 16, 28);
            },

            _drawStar(ctx, cx, cy, points, outerR, innerR) {
                ctx.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const angle = (Math.PI / points) * i - Math.PI / 2;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }
        });

        this.states.register(STATES.PAUSED, {
            enter() { },

            update(dt) {
                if (game.input.pause || game.input.confirm) {
                    game.states.switch(STATES.PLAYING);
                }
            },

            render(ctx) {
                const playingState = game.states._states.get(STATES.PLAYING);
                if (playingState) playingState.render(ctx);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                ctx.font = '24px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('PAUSED', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);

                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#aaa';
                ctx.fillText('Press ESC or ENTER to resume', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20);
            }
        });

        this.states.register(STATES.GAME_OVER, {
            enter() { },
            update(dt) {
                if (game.input.confirm) {
                    game.states.switch(STATES.MENU);
                }
            },
            render(ctx) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
                ctx.font = '24px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ff3366';
                ctx.fillText('GAME OVER', GAME.WIDTH / 2, GAME.HEIGHT / 2);
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#aaa';
                ctx.fillText('Press ENTER to continue', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 40);
            }
        });
    }

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

    _onResize() {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;
        const targetRatio = GAME.WIDTH / GAME.HEIGHT;
        const windowRatio = windowW / windowH;

        let scale;
        if (windowRatio > targetRatio) {
            scale = windowH / GAME.HEIGHT;
        } else {
            scale = windowW / GAME.WIDTH;
        }

        this._scale = Math.max(1, Math.floor(scale));

        const floorWidth = GAME.WIDTH * this._scale;
        const floorHeight = GAME.HEIGHT * this._scale;
        if (floorWidth < windowW * 0.8 || floorHeight < windowH * 0.8) {
            this._scale = scale;
        }

        this.canvas.style.width = `${GAME.WIDTH * this._scale}px`;
        this.canvas.style.height = `${GAME.HEIGHT * this._scale}px`;
    }
}

const game = new Game();
window.__COSMODASH__ = game;
