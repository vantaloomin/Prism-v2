# ✦ Project Prism ✦

> High-fidelity WebGL Gacha Collection Experience

Project Prism is a sophisticated web-based card collection game that blends artistic character design with cutting-edge visual technology. It features a robust RNG-based pack opening system, dynamic WebGL shaders for holographic effects, and fluid GSAP-driven animations to create a premium "God Roll" collection experience.

## ✨ Key Features

### 🎁 Pack Shop & Economy
- **Dynamic Pack System**: Purchase themed packs (Waifu, Husbando, or the legendary God Pack) using a virtual credit system.
- **Save State Persistence**: Automatically tracks your credits, inventory, and opening statistics using `localStorage`.

### 🧮 3-Axis RNG Engine
Every card is generated using a sophisticated triple-weighted roll system:
1. **Rarity (C to UR)**: Determines the base value and scarcity of the character.
2. **Frame Style**: Assigns aesthetic borders ranging from standard White to rare Rainbow and Black.
3. **Holographic Tier**: Multi-layered effects from classic Shiny to the reality-warping Void.

### 🎨 WebGL Shader Engine
A custom-built WebGL 2.0 engine handles real-time visual enhancements:
- **Reactive Overlays**: Light sweeps, prismatic diffraction, and voronoi-based noise patterns.
- **Interactive Focus Mode**: Mouse-reactive holographic effects that respond to your movements during card inspection.
- **Procedural Fractals & Voids**: Advanced GLSL shaders for ultra-rare card tiers.

### 🎭 Dramatic Animations (GSAP)
- **Pack Opening Sequence**: High-tension physical shake and burst effects.
- **Card Dealing**: Fluid, staggered dealing animations with 3D flip reveals.
- **Glow Tiers**: Visual screen-shaking and flash effects based on the statistical "True Rarity" of a pull.

## 🛠️ Tech Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+).
- **Styling**: Modern CSS with Glassmorphism, CSS Variables, and Flex/Grid layouts.
- **Visuals**: **WebGL 2.0** (Custom GLSL Shaders) for real-time GPU-accelerated effects.
- **Animations**: **GSAP** (GreenSock Animation Platform) for high-performance motion.
- **Data**: JSON-based character lore and metadata.

## 📁 Project Structure

```text
├── assets/
│   ├── backgrounds/     # Dynamic environment art
│   ├── waifu/           # Character portraits
│   ├── husbando/        # Character portraits
│   └── lore/            # characters.json (Backstory & Quotes)
├── style.css            # Base design system & layout
├── frames.css           # Card frame variations
├── holos.css            # CSS-fallback holographic styles
├── game.js             # Core engine & RNG logic
├── shader-engine.js    # WebGL/GLSL rendering system
├── animations.js       # GSAP interaction sequences
└── index.html          # Application entry point
```

## 🚀 Getting Started

1. Clone the repository.
2. Open `index.html` in any modern web browser (Chrome or Firefox recommended for WebGL2 support).
3. Start with **1000 Credits** and open your first pack!

---

*“To look upon her is to forget one's own name; mortals simply break under the weight of such perfection.”*
— **The Goddess of Love** (UR Character)
