# Aethel Saga

**A premium gacha card collection experience — built entirely in the browser.**

Aethel Saga delivers the dopamine rush of opening rare card packs with stunning GPU-accelerated holographic effects, dramatic reveal animations, and a deep collection system. No downloads. No installs. Just open and play.

> **100% Free. Forever.** While Aethel Saga captures the excitement of gacha mechanics, there are **no microtransactions, no ads, and no way to spend real money**. All credits are earned through gameplay. This is purely for the joy of collecting — no strings attached.

---

## What Makes This Different

### GPU-Powered Holographic Cards
Every rare card shimmers with **real-time WebGL shaders** — not static overlays or CSS tricks. Watch light sweep across prismatic surfaces, cosmic voids pulse with nebula effects, and crystalline fractals refract as you move your mouse. These aren't animations; they're live GPU computations responding to you.

### The Thrill of the Pull
A 3-axis RNG system means every pack is unpredictable:
- **Rarity** — From common pulls to legendary Ultra Rares
- **Frame** — White, Blue, Red, Gold, Rainbow, or the elusive Black border
- **Holographic** — Shiny, Rainbow, Pearlescent, Fractal, or Void

The rarest combinations trigger screen-shaking "True Rarity" effects. You'll know when you hit the jackpot.

### Collector's Dream
Cards stack visually when you pull duplicates. Focus Mode lets you inspect any card up close with interactive holographic tilt. Your entire collection persists locally — come back anytime to admire your pulls.

### Wizard Duel Mini-Game
Earn credits by battling an AI wizard in elemental combat. Fire beats Earth. Earth beats Water. Water beats Fire. Win streaks mean bigger rewards.

---

## See It In Action

| Open a Pack | Inspect Your Pulls | Battle for Credits |
|-------------|--------------------|--------------------|
| Dramatic burst animations with staggered card reveals | Mouse-reactive holographic effects in Focus Mode | Elemental RPS with dynamic AI reactions |

---

## Technical Details

### Tech Stack
| Layer | Technology |
|-------|------------|
| Build | Vite 6.x |
| Core | Vanilla JavaScript (ES6 Modules) |
| Styling | CSS3 with Glassmorphism |
| Animations | GSAP 3.12 |
| Visuals | WebGL 2.0 with Custom GLSL Shaders |

### Browser Requirements
- **Minimum Viewport:** 1024 × 768 pixels
- A CSS-only viewport blocker ensures mobile users see a friendly message directing them to use a larger screen
- WebGL 2.0 support required for holographic effects

### Run Locally

```bash
git clone https://github.com/vantaloomin/Prism-v2.git
cd Prism-v2
npm install
npm run dev
```

Open http://localhost:5173 — you start with **1000 Credits** to open your first packs.

### Production Build

```bash
npm run build
npm run preview
```

---

## Modding

Want to add your own card packs? Aethel Saga features a **dynamic pack system** that makes modding easy — no code changes required!

📖 **[Read the Modding Guide](MODDING.md)** to learn how to create custom packs with your own characters, backgrounds, and lore.

---

## License

MIT License — See [LICENSE](LICENSE) for details.
