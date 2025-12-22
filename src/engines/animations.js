/* ============================================
   PROJECT PRISM - GSAP ANIMATIONS
   Dramatic pack opening and card effects
   ============================================ */

import { gsap } from 'gsap';

// ============================================
// ANIMATION CONFIGURATION
// ============================================

export const AnimConfig = {
    // Pack opening phases
    pack: {
        shakeDuration: 0.08,
        shakeIntensity: 8,
        shakeCount: 6,
        anticipationDuration: 0.4,
        burstDuration: 0.5
    },
    // Card dealing
    cards: {
        dealDelay: 0.15,
        dealDuration: 0.4,
        flipDelay: 0.8,
        flipStagger: 0.2
    },
    // Special effects for rare cards
    rare: {
        screenShakeDuration: 0.3,
        glowPulseDuration: 0.5
    }
};

// ============================================
// PACK OPENING ANIMATION
// ============================================

/**
 * Create dramatic pack opening animation with rip-open effect
 * @param {HTMLElement} packElement - The pack image element
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function createPackOpeningAnimation(packElement) {
    const tl = gsap.timeline();
    const container = packElement.closest('.pack-animation-container');

    // Create energy particles container
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 10;
    `;
    container.appendChild(particleContainer);

    // Phase 1: Initial excited wiggle - pack is eager to be opened!
    tl.to(packElement, {
        rotation: -3,
        duration: 0.06,
        ease: "power1.inOut"
    });

    // Quick wiggles
    for (let i = 0; i < 8; i++) {
        tl.to(packElement, {
            rotation: i % 2 === 0 ? 4 : -4,
            duration: 0.05,
            ease: "power1.inOut"
        });
    }

    // Reset rotation
    tl.to(packElement, {
        rotation: 0,
        duration: 0.1
    });

    // Phase 2: Energy buildup with glow
    tl.to(packElement, {
        scale: 1.08,
        boxShadow: "0 0 30px 10px rgba(139, 92, 246, 0.6)",
        duration: 0.3,
        ease: "power2.out"
    });

    // Add subtle pulsing flashes during buildup
    tl.call(() => {
        createEnergyFlash(container, 0.15, 0.3);
    });

    tl.to(packElement, {
        scale: 1.12,
        boxShadow: "0 0 50px 20px rgba(236, 72, 153, 0.7)",
        duration: 0.25,
        ease: "power2.in"
    });

    tl.call(() => {
        createEnergyFlash(container, 0.25, 0.5);
    });

    // Phase 3: Tension - pack strains
    tl.to(packElement, {
        scaleY: 1.15,
        scaleX: 0.95,
        boxShadow: "0 0 80px 30px rgba(255, 255, 255, 0.6)",
        duration: 0.15,
        ease: "power4.in"
    });

    // Phase 4: THE RIP! - Explosive tear
    tl.call(() => {
        // Create the torn top element
        createTornTop(packElement, container);

        // Spawn energy particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => createEnergyParticle(particleContainer, packElement), i * 20);
        }

        // Screen shake
        screenShake(3);

        // Big flash
        createEnergyFlash(container, 0.7, 0.2);
    });

    // Pack reacts to being ripped
    tl.to(packElement, {
        scaleY: 1.0,
        scaleX: 1.0,
        y: 20,
        duration: 0.15,
        ease: "power2.out"
    });

    // Add glow emanating from inside
    tl.to(packElement, {
        boxShadow: "0 0 100px 40px rgba(255, 215, 0, 0.8)",
        duration: 0.2,
        ease: "power2.out"
    }, "<");

    // Phase 5: Cards are revealed! Pack explodes outward
    tl.call(() => {
        // More particles
        for (let i = 0; i < 15; i++) {
            setTimeout(() => createEnergyParticle(particleContainer, packElement), i * 30);
        }
        createEnergyFlash(container, 0.9, 0.15);
    });

    tl.to(packElement, {
        scale: 1.8,
        opacity: 0,
        y: -50,
        duration: 0.4,
        ease: "power2.in"
    });

    // Cleanup
    tl.call(() => {
        particleContainer.remove();
        // Remove any torn pieces
        container.querySelectorAll('.torn-top').forEach(el => el.remove());
    });

    return tl;
}

/**
 * Create a torn top piece that flies off
 */
function createTornTop(packElement, container) {
    const rect = packElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const tornTop = document.createElement('div');
    tornTop.className = 'torn-top';
    tornTop.style.cssText = `
        position: absolute;
        left: ${rect.left - containerRect.left}px;
        top: ${rect.top - containerRect.top}px;
        width: ${rect.width}px;
        height: ${rect.height * 0.15}px;
        background: linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.6));
        border-radius: 12px 12px 0 0;
        z-index: 20;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        clip-path: polygon(0% 0%, 100% 0%, 95% 100%, 85% 90%, 70% 100%, 55% 85%, 40% 100%, 25% 90%, 10% 100%, 0% 85%);
    `;
    container.appendChild(tornTop);

    // Animate the torn piece flying off
    gsap.to(tornTop, {
        y: -200,
        x: gsap.utils.random(-100, 100),
        rotation: gsap.utils.random(-45, 45),
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => tornTop.remove()
    });
}

/**
 * Create an energy particle that bursts from the pack
 */
function createEnergyParticle(container, packElement) {
    const particle = document.createElement('div');
    const size = gsap.utils.random(4, 12);
    const colors = ['#8b5cf6', '#ec4899', '#fbbf24', '#ffffff', '#60a5fa'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const rect = packElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const startX = rect.left - containerRect.left + rect.width / 2;
    const startY = rect.top - containerRect.top + rect.height * 0.15; // From the tear line

    particle.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        box-shadow: 0 0 ${size * 2}px ${color};
        z-index: 15;
    `;
    container.appendChild(particle);

    // Animate outward in a burst pattern
    const angle = gsap.utils.random(0, Math.PI * 2);
    const distance = gsap.utils.random(100, 250);
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance - 50; // Bias upward

    gsap.to(particle, {
        x: endX,
        y: endY,
        opacity: 0,
        scale: 0.3,
        duration: gsap.utils.random(0.5, 1.0),
        ease: "power2.out",
        onComplete: () => particle.remove()
    });
}

/**
 * Create a flash overlay
 */
function createEnergyFlash(container, intensity = 0.5, duration = 0.3) {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 255, 255, ${intensity}), transparent 70%);
        pointer-events: none;
        z-index: 25;
    `;
    container.appendChild(flash);

    gsap.to(flash, {
        opacity: 0,
        duration: duration,
        ease: "power2.out",
        onComplete: () => flash.remove()
    });
}

// ============================================
// CARD DEALING ANIMATION
// ============================================

/**
 * Animate cards dealing onto the display area
 * @param {HTMLElement[]} cardElements - Array of card DOM elements
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function createCardDealingAnimation(cardElements) {
    const tl = gsap.timeline();

    // Set initial state - cards start off screen and small
    gsap.set(cardElements, {
        y: -100,
        opacity: 0,
        scale: 0.5,
        rotationY: 0
    });

    // Deal cards with stagger
    tl.to(cardElements, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: AnimConfig.cards.dealDuration,
        stagger: AnimConfig.cards.dealDelay,
        ease: "back.out(1.2)"
    });

    return tl;
}

/**
 * Animate a single card flip with dramatic reveal
 * @param {HTMLElement} cardElement - The card element
 * @param {Object} cardData - Card data for rarity-based effects
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function createCardFlipAnimation(cardElement, cardData) {
    const tl = gsap.timeline();
    const cardInner = cardElement.querySelector('.card-inner');

    // Quick lift before flip
    tl.to(cardElement, {
        y: -20,
        scale: 1.1,
        duration: 0.15,
        ease: "power2.out"
    });

    // The flip itself
    tl.to(cardInner, {
        rotationY: 180,
        duration: 0.5,
        ease: "power2.inOut"
    }, "<0.05");

    // Settle back down
    tl.to(cardElement, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "bounce.out"
    }, "-=0.2");

    return tl;
}

// ============================================
// RARE CARD SPECIAL EFFECTS
// ============================================

/**
 * Trigger special effects for rare card reveals
 * @param {HTMLElement} cardElement - The card element
 * @param {Object} cardData - Card data with rarity info
 */
/**
 * Trigger special effects based on card probability (Tiered System)
 * @param {HTMLElement} cardElement - The card element
 * @param {Object} cardData - Card data with combinedProb
 */
export function triggerRareCardEffects(cardElement, cardData) {
    // If combinedProb exists, use it. Otherwise fallback to old rarity (for backward compat)
    const prob = cardData.combinedProb || 1.0;
    const tier = getGlowTier(prob);

    if (tier.name === 'Common') return;

    // Apply effects based on calculated tier
    const intensity = tier.intensity;

    // Screen shake for Epic+
    if (intensity >= 2) {
        screenShake(intensity);
    }

    // Glow pulse for the card (all Non-Commons)
    cardGlowPulse(cardElement, tier);

    // Screen flash for God Roll
    if (tier.name === 'God Roll') {
        screenFlash();
        createGodRollParticles(cardElement); // Extra particle effect
    } else if (intensity >= 4) {
        screenFlash();
    }
}

/**
 * Get Glow Tier based on probability
 * @param {number} prob - Combined probability
 * @returns {Object} Tier config { name, color, intensity }
 */
function getGlowTier(prob) {
    if (prob < 0.0001) return { name: 'God Roll', color: 'rainbow', intensity: 5 };
    if (prob < 0.0004) return { name: 'Mythic', color: 'rgba(250, 204, 21, 1.0)', intensity: 4 }; // Gold
    if (prob < 0.002) return { name: 'Legendary', color: 'rgba(217, 70, 239, 0.9)', intensity: 3 }; // Pink/Purple
    if (prob < 0.01) return { name: 'Epic', color: 'rgba(59, 130, 246, 0.9)', intensity: 2 }; // Blue
    if (prob < 0.02) return { name: 'Rare', color: 'rgba(34, 197, 94, 0.8)', intensity: 1 }; // Green
    if (prob < 0.1) return { name: 'Uncommon', color: 'rgba(255, 255, 255, 0.6)', intensity: 1 }; // Subtle White
    return { name: 'Common', color: null, intensity: 0 };
}

/**
 * Pulse glow effect on a card
 * @param {HTMLElement} cardElement - Card element
 * @param {Object} tier - Tier object with color info
 */
function cardGlowPulse(cardElement, tier) {
    if (!tier.color) return;

    // God Roll Rainbow Effect
    if (tier.name === 'God Roll') {
        gsap.to(cardElement, {
            boxShadow: "0 0 60px 20px rgba(255, 0, 0, 0.8)",
            duration: 2,
            repeat: -1,
            yoyo: true,
            keyframes: {
                "0%": { boxShadow: "0 0 60px 20px rgba(255, 0, 0, 0.8)" },
                "20%": { boxShadow: "0 0 60px 20px rgba(255, 165, 0, 0.8)" },
                "40%": { boxShadow: "0 0 60px 20px rgba(255, 255, 0, 0.8)" },
                "60%": { boxShadow: "0 0 60px 20px rgba(0, 255, 0, 0.8)" },
                "80%": { boxShadow: "0 0 60px 20px rgba(0, 0, 255, 0.8)" },
                "100%": { boxShadow: "0 0 60px 20px rgba(238, 130, 238, 0.8)" }
            }
        });
        return;
    }

    // Standard single-color pulse
    gsap.fromTo(cardElement,
        { boxShadow: `0 0 0px 0px ${tier.color}` },
        {
            boxShadow: `0 0 40px 15px ${tier.color}`,
            duration: AnimConfig.rare.glowPulseDuration,
            repeat: 2,
            yoyo: true,
            ease: "power2.inOut"
        }
    );
}

/**
 * Create particle explosion for God Rolls
 * @param {HTMLElement} element - Target element
 */
function createGodRollParticles(element) {
    // Simple placeholder for particle system
    // Could be expanded with more GSAP physics later
    gsap.to(element, {
        rotation: 360,
        duration: 1,
        ease: "back.out(1.7)"
    });
}

/**
 * Shake the entire screen
 * @param {number} intensity - Shake intensity (1-5)
 */
export function screenShake(intensity = 1) {
    const container = document.querySelector('.app-container');
    if (!container) return;

    const strength = intensity * 3;

    gsap.to(container, {
        x: strength,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => gsap.set(container, { x: 0 })
    });
}

/**
 * Flash the screen white briefly
 */
export function screenFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: white;
        pointer-events: none;
        z-index: 9999;
    `;
    document.body.appendChild(flash);

    gsap.fromTo(flash,
        { opacity: 0.8 },
        {
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => flash.remove()
        }
    );
}

// ============================================
// HOLO EFFECT ANIMATIONS
// ============================================

/**
 * Create smooth holo shimmer animation using GSAP
 * @param {HTMLElement} cardElement - Card element with holo layer
 * @param {string} holoType - Type of holo effect
 */
export function animateHoloShimmer(cardElement, holoType) {
    if (holoType === 'none') return;

    const holoLayer = cardElement.querySelector('.card-layer-holo');
    if (!holoLayer) return;

    // Continuous shimmer animation using CSS custom properties
    gsap.to(holoLayer, {
        '--shimmer-angle': '360deg',
        duration: 3,
        repeat: -1,
        ease: "none",
        modifiers: {
            '--shimmer-angle': (value) => `${parseFloat(value) % 360}deg`
        }
    });
}

/**
 * Animate holo light position smoothly (for focus mode)
 * @param {HTMLElement} cardElement - The focused card
 * @param {number} targetX - Target X position (0-100)
 * @param {number} targetY - Target Y position (0-100)
 */
function animateHoloLight(cardElement, targetX, targetY) {
    gsap.to(cardElement, {
        '--light-x': `${targetX}%`,
        '--light-y': `${targetY}%`,
        duration: 0.1,
        ease: "power2.out"
    });
}

// ============================================
// COLLECTION ANIMATIONS
// ============================================

/**
 * Animate cards appearing in the collection grid
 * @param {HTMLElement[]} cardElements - Card elements to animate
 */
export function animateCollectionCards(cardElements) {
    gsap.from(cardElements, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        stagger: 0.03,
        ease: "back.out(1.5)"
    });
}

/**
 * Animate page transition in collection
 * @param {HTMLElement} container - Collection container
 * @param {string} direction - 'next' or 'prev'
 */
function animatePageTransition(container, direction) {
    const xOffset = direction === 'next' ? -50 : 50;

    gsap.fromTo(container,
        { x: -xOffset, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
    );
}

// ============================================
// UTILITY ANIMATIONS
// ============================================

/**
 * Bounce animation for interactive feedback
 * @param {HTMLElement} element - Element to bounce
 */
export function bounceFeedback(element) {
    gsap.fromTo(element,
        { scale: 1 },
        {
            scale: 1.1,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
        }
    );
}

/**
 * Pulse animation for attention
 * @param {HTMLElement} element - Element to pulse
 */
export function pulseAttention(element) {
    gsap.to(element, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

console.log('✦ GSAP Animations loaded! ✦');
