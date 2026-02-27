<div align="center">

# 🚀 CosmoDash

### _Dash Beyond the Stars_ ✨


> _The galaxy is collapsing. A massive black hole is consuming everything in its path._
> _Only one explorer is brave enough to stop it._
> _That explorer is you._

<br>

</div>

---

## 🎮 The Game

You play as **Nova Ryder** 👨‍🚀 — a fearless space explorer on an epic mission across the solar system 🌍💫 to collect **Star Cores** ⭐ and stop a giant **black hole** 🕳️ from swallowing the galaxy.

Run, jump, and **dash** through planets, asteroid fields ☄️, and space stations while battling space enemies 👾 and conquering bosses that stand in your way.

Every planet has **different gravity** and wild challenges — from floating through the low-gravity Lunar Base 🌙 to sliding across Saturn's icy rings 🪐❄️ — keeping every level fresh, fast, and fun.

---

## ✨ Features

|     | Feature                     | Description                                                                  |
| --- | --------------------------- | ---------------------------------------------------------------------------- |
| 🏃  | **Mario-Style Platforming** | Acceleration-based movement, variable jump height, tight responsive controls |
| 🚀  | **Double Jump & Dash**      | Jetpack-powered double jump + signature speed dash with brief invincibility  |
| 🪐  | **8 Planet Levels**         | Each with unique gravity, hazards, and visual themes                         |
| ⭐  | **Star Core Collectibles**  | Hidden across risky spots — collect 100 for an extra life!                   |
| 👾  | **4 Enemy Types**           | Space Grunts, Astro Floaters, Shield Drones, and Meteor Crawlers             |
| 🐉  | **3 Epic Boss Fights**      | Multi-phase battles with unique attack patterns                              |
| 🎨  | **Pixel Art Visuals**       | Retro-inspired sprites, parallax backgrounds, and particle effects           |
| 🔊  | **Chiptune Audio**          | Original SFX and synth-wave background music                                 |

---

## 🎹 Controls

```
┌─────────────────────────────────────────────┐
│                                             │
│   ⬆️ W                        [ SPACE ] 🦘  │
│   ⬅️ A  ⬇️ S  ➡️ D              Jump        │
│                                             │
│   [ SHIFT ] 💨                [ ESC ] ⏸️     │
│     Dash                       Pause        │
│                                             │
└─────────────────────────────────────────────┘
```

| Action           | Keys                  | Pro Tip                                                |
| ---------------- | --------------------- | ------------------------------------------------------ |
| 🏃 Move          | `Arrow Keys` / `WASD` | Acceleration builds — hold for speed!                  |
| 🦘 Jump          | `Space`               | **Hold longer = jump higher!**                         |
| 🦘🦘 Double Jump | `Space` (mid-air)     | Jetpack burst for extra height                         |
| 💨 Dash          | `Shift`               | Fast burst with brief invincibility — use it to dodge! |
| ⏸️ Pause         | `Escape`              | Take a breather, space is intense                      |

---

## 🛠️ Tech Stack

|     | Tech                   | Details                                              |
| --- | ---------------------- | ---------------------------------------------------- |
| 📜  | **Vanilla JavaScript** | ES6 modules — zero dependencies, zero frameworks     |
| 🎨  | **HTML5 Canvas 2D**    | All rendering on a single performant canvas          |
| 📐  | **960×540**            | Logical resolution — scales crisp to any screen size |
| 🎯  | **60 FPS**             | Fixed timestep game loop for buttery smooth gameplay |

---

## 🚀 Quick Start

### 📋 Prerequisites

- 🌐 A modern browser — Chrome, Firefox, or Edge
- 🖥️ A local HTTP server (ES6 modules need it)

---

### ⚡ Option 1 — Python (quickest)

```bash
cd CosmoDash
python -m http.server 8080
```

Then open 👉 **http://localhost:8080**

---

### 💻 Option 2 — VS Code Live Server

1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**
3. 🎮 Game launches in your browser automatically!

---

### 📦 Option 3 — Node.js

```bash
npx serve .
```

Then open the URL shown in terminal (usually 👉 **http://localhost:3000**)

---

### ⚠️ Important

> Opening `index.html` directly as a `file://` **will not work** — browsers block ES6 module imports from the local filesystem. Use one of the server options above.

---

## 📁 Project Structure

```
🚀 CosmoDash/
│
├── 📄 index.html              → Entry point
├── 🎨 index.css               → Global styles & canvas layout
├── 📖 README.md               → You are here!
├── 📋 PHASES.md               → Development roadmap
│
├── 🖼️ assets/
│   ├── 🎨 images/             → Sprites, tilesets, backgrounds
│   └── 🔊 sounds/             → SFX and music
│
└── ⚙️ js/
    ├── 🏗️ engine/
    │   ├── Game.js             → Game loop & state bootstrap
    │   ├── StateManager.js     → Finite state machine
    │   ├── InputManager.js     → Keyboard & gamepad input
    │   ├── AssetLoader.js      → Image/audio preloader
    │   └── Camera.js           → Smooth follow & screen shake
    │
    └── 🔧 utils/
        ├── Constants.js        → Global config & physics values
        └── Vector2.js          → 2D vector math utilities
```

---

## 🗺️ The Journey — Planet Map

```
  🌍 Earth Station     → Tutorial, normal gravity
     │
  🌙 Lunar Base        → Low gravity, floating platforms
     │
  🔴 Mars Canyon       → Wind gusts, sand hazards
     │
  ☄️ Asteroid Belt     → Moving platforms, zero-G sections
     │
  🟠 Jupiter Storm     → High gravity, electric hazards
     │
  🪐 Saturn Rings      → Ice physics, rail-riding
     │
  🔵 Neptune Depths    → Underwater-style, spotlight visibility
     │
  🕳️ Black Hole Fortress → Gravity flips, FINAL BOSS
```

---

<div align="center">

### 🌌 Ready to save the galaxy?

**Start the server. Press Enter. Dash beyond the stars.**

⭐ Star this repo if you're excited for the adventure!

---

_Made with ❤️ and way too much coffee ☕_

</div>
