# ✦ Project Prism ✦

> High-fidelity WebGL Gacha Collection Experience

A sophisticated web-based card collection game featuring a robust RNG-based pack opening system, dynamic WebGL shaders for holographic effects, and fluid GSAP-driven animations.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/prism-v2.git
cd prism-v2

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open http://localhost:5173 in your browser. Start with **1000 Credits** and open your first pack!

### Production Build

```bash
npm run build     # Build for production
npm run preview   # Preview the build locally
```

## ✨ Key Features

### 🎁 Pack Shop & Economy
- **Dynamic Pack System** — Purchase themed packs (Waifu, Husbando, or the legendary God Pack)
- **Save State Persistence** — Credits, inventory, and statistics persist via `localStorage`

### 🧮 3-Axis RNG Engine
Every card uses a triple-weighted roll system:
1. **Rarity** (C → UR) — Character scarcity tier
2. **Frame Style** — White, Blue, Red, Gold, Rainbow, or Black borders
3. **Holographic Tier** — None, Shiny, Rainbow, Pearlescent, Fractal, or Void

### 🎨 WebGL Shader Engine
Custom WebGL 2.0 engine for real-time GPU-accelerated effects:
- Reactive light sweeps and prismatic diffraction
- Interactive mouse-tracking holo effects in Focus Mode
- Procedural fractals and cosmic void shaders for ultra-rare cards

### 🎭 Dramatic Animations (GSAP)
- Pack shake and burst opening sequence
- Staggered card dealing with 3D flip reveals
- Screen-shaking "True Rarity" effects for epic pulls

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite 6.x |
| **Core** | Vanilla JavaScript (ES6 Modules) |
| **Styling** | CSS3 (Glassmorphism, Variables, Flex/Grid) |
| **Animations** | GSAP 3.12 |
| **Visuals** | WebGL 2.0 (Custom GLSL Shaders) |
| **Data** | JSON (character lore and metadata) |

## 📁 Project Structure

```
prism-v2/
├── index.html              # Entry point
├── package.json            # npm configuration
├── vite.config.js          # Vite build config
│
├── src/                    # JavaScript modules
│   ├── main.js             # App initialization
│   ├── state.js            # Game state & persistence
│   ├── card.js             # Card DOM creation
│   ├── shop.js             # Pack opening logic
│   ├── collection.js       # Collection rendering
│   ├── focus.js            # Focus mode overlay
│   │
│   ├── engines/            # Core systems
│   │   ├── pack-logic.js   # RNG & card generation
│   │   ├── animations.js   # GSAP animation sequences
│   │   └── shader-engine.js # WebGL/GLSL renderer
│   │
│   └── modules/            # Feature modules
│       └── games.js        # Mini-game system
│
├── styles/                 # CSS modules
│   ├── style.css           # Base design system
│   ├── tabs.css            # Tab navigation
│   ├── frames.css          # Card frame variations
│   ├── holos.css           # Holographic effects
│   ├── collection.css      # Collection grid
│   ├── focus.css           # Focus mode UI
│   ├── games.css           # Games interface
│   └── landing.css         # Landing page
│
└── assets/                 # Static assets
    ├── backgrounds/        # Environment art
    ├── waifu/              # Character portraits
    ├── husbando/           # Character portraits
    └── lore/               # characters.json
```

## 🎮 Controls

| Action | Result |
|--------|--------|
| Click pack | Open and reveal cards |
| Click face-up card | Open Focus Mode for inspection |
| Move mouse in Focus | Interactive holographic tilt |
| Press `Escape` | Return to landing page |

## 📜 License

MIT License — See [LICENSE](LICENSE) for details.

---

*"To look upon her is to forget one's own name; mortals simply break under the weight of such perfection."*
— **The Goddess of Love** (UR Character)
