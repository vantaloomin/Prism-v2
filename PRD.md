# Product Requirements Document: Project Prism

## 1. Project Overview

**Concept:** A standalone, offline web game combining arcade-style mini-games with a high-fidelity card collection system.
**Platform:** Web Browser (Local Host / `file://`).
**Core Loop:** Users play mini-games against visual AI opponents to earn currency $\rightarrow$ currency is used to buy packs $\rightarrow$ packs are opened to collect dynamically generated cards.

## 2. Technical Constraints & Data Strategy

* **Zero Connectivity:** No internet connection required. No API calls, no Google Analytics, no crash reporting.
* **Local Persistence:** All progress (Inventory, Currency, Stats) is saved strictly to the browser's `localStorage` or `IndexedDB`.
* **Data Management:** Users must have the ability to:
    * **Save:** Auto-save on specific triggers (win, pack open).
    * **Wipe:** "Delete Save" button to reset progress.
* **Rendering:** The application acts as a compositor. It does not load pre-baked card images; it assembles them in real-time using layers (HTML5 Canvas or CSS Stacking).

---

## 3. The Arcade (Currency Generation)

Users wager or earn "Credits" by beating the AI. The opponent is a logic-based script (non-LLM).

### Mini-Games

1. **Rock / Paper / Scissors**
2. **Blackjack**
3. **Poker**
4. **Tic-Tac-Toe**

### AI Representation

The AI is not a static menu; it requires an on-screen Avatar that visually reacts to the game state.

* **RPS:** Avatar plays an animation to "throw" Rock, Paper, or Scissors.
* **Card Games:** Avatar holds a hand of cards; chips are placed on the table.
* **Board Games:** Avatar focuses on the board and places pieces.

---

## 4. The Gacha Shop

* **Inventory:** Two permanent SKUs.
    1. **Waifu Pack:** Female character art pool.
    2. **Husbando Pack:** Male character art pool.
* **Cost:** Fixed Credit cost per pack.

---

## 5. Card Architecture (Visual Stack)

The client renders cards by stacking independent layers. This allows for millions of visual combinations.

**Layer Order (Bottom to Top):**

1. **Card Backing:** Standard design (visible during the "deal").
2. **Background Art:** Abstract or scenic layer.
3. **Character Art:** The primary asset (Waifu/Husbando PNG with transparency).
4. **Frame & Hue Layer:** A border overlaid on the card, tinting the background.
5. **Holographic Layer:** A CSS/Canvas filter (blend mode) applied over the top.
6. **UI Stats:** Name, Rarity Icon, Set Number.

---

## 6. Drop Logic & Probabilities

The drop system uses a **Multi-Axis RNG** approach. A single card is the result of three independent dice rolls.

**The "God Roll" Target:**
A card featuring **[UR] Rarity** + **[Black] Frame** + **[Void] Holo** occurs **1 in 5,000,000**.

### Axis A: Base Rarity (Character Stats)

*Determines the character art pool.*

| Rarity Tag | Name | Probability | Odds |
| --- | --- | --- | --- |
| **[C]** | Common | 50% | 1 : 2 |
| **[R]** | Rare | 30% | ~1 : 3.3 |
| **[SR]** | Super Rare | 14% | ~1 : 7 |
| **[SSR]** | Super Special Rare | 5% | 1 : 20 |
| **[UR]** | **Ultra Rare** | **1%** | **1 : 100** |

### Axis B: Frame & Hue

*Determines border color and background tint.*

| Frame Style | Probability | Visual Style |
| --- | --- | --- |
| **White / No Hue** | 50.0% | Clean, standard look. |
| **Blue** | 30.0% | Cool temperature. |
| **Red** | 15.0% | Warm temperature. |
| **Gold** | 3.55% | Metallic luster. |
| **Rainbow** | 1.0% | RGB cycle. |
| **Black** | **~0.45%** | **Matte black, high contrast.** |

### Axis C: Holographic Overlay

*Determines the texture finish and light reaction.*

| Effect | Probability | Visual Style |
| --- | --- | --- |
| **No Holo** | 60.0% | Standard matte. |
| **Shiny** | 20.0% | Diagonal white sheen. |
| **Rainbow** | 10.0% | Prismatic foil. |
| **Pearlescent** | 8.0% | Pink/Green oil slick. |
| **Fractal** | ~1.55% | Geometric crystal patterns. |
| **Void** | **~0.45%** | **Dark matter / sucking particle effect.** |

---

## 7. UX & Animation

**Pack Opening Sequence:**

* **The Crate:** Users click a sealed pack. It shakes/rumbles based on the potential rarity inside (predetermined at moment of click, but hidden from user).
* **The Deal:** Cards fly out face down.
* **The Flip:** User clicks cards individually to flip.
* **The Tease:** If a card is [UR] or has a [Void] effect, the card emits a specific glow or sound *before* the flip to build tension.
* **The Reveal:** High-tier cards trigger screen shake or confetti effects upon flipping.

**Collection (Gallery):**

* Grid view of all owned cards.
* Clicking a card opens "Inspection Mode" (Full screen, high-res render).
* Filtering by Axis A, B, or C.

---

## 8. MVP Asset Requirements

* **Character Art:** 20 Images (10 Waifu, 10 Husbando).
* **Avatar Art:** 4 Sets (Idle, Win, Lose, Action states).
* **Frames:** 1 Master frame shape with CSS filters for colors (White, Blue, Red, Gold, Black) + 1 Animated Sprite (Rainbow).
* **Holo Masks:** 5 Texture maps (Shiny, Rainbow, Pearl, Fractal, Void) for CSS masking/blending.
* **Audio:** Pack open sound, Card flip sound, "Rare" jingle, "Legendary" fanfare.
