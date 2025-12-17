/* ============================================
   PROJECT PRISM - GSAP ANIMATIONS
   Dramatic pack opening and card effects
   ============================================ */

// ============================================
// ANIMATION CONFIGURATION
// ============================================

const AnimConfig = {
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
 * Create dramatic pack opening animation with anticipation
 * @param {HTMLElement} packElement - The pack image element
 * @returns {gsap.core.Timeline} GSAP timeline
 */
function createPackOpeningAnimation(packElement) {
    const tl = gsap.timeline();

    // Phase 1: Initial shake - "something's happening!"
    tl.to(packElement, {
        rotation: -AnimConfig.pack.shakeIntensity,
        duration: AnimConfig.pack.shakeDuration,
        ease: "power2.out"
    });

    // Shake back and forth with increasing intensity
    for (let i = 0; i < AnimConfig.pack.shakeCount; i++) {
        const intensity = AnimConfig.pack.shakeIntensity * (1 + i * 0.3);
        tl.to(packElement, {
            rotation: i % 2 === 0 ? intensity : -intensity,
            duration: AnimConfig.pack.shakeDuration * (1 - i * 0.05),
            ease: "power1.inOut"
        });
    }

    // Phase 2: Anticipation pause - build tension
    tl.to(packElement, {
        rotation: 0,
        scale: 1.15,
        duration: AnimConfig.pack.anticipationDuration,
        ease: "power2.out"
    });

    // Add glow effect during anticipation
    tl.to(packElement, {
        boxShadow: "0 0 60px 20px rgba(139, 92, 246, 0.8)",
        duration: AnimConfig.pack.anticipationDuration * 0.8,
        ease: "power2.in"
    }, "<");

    // Phase 3: THE BURST! - explosive reveal
    tl.to(packElement, {
        scale: 1.5,
        opacity: 0,
        rotation: 180,
        duration: AnimConfig.pack.burstDuration,
        ease: "power4.in"
    });

    return tl;
}

// ============================================
// CARD DEALING ANIMATION
// ============================================

/**
 * Animate cards dealing onto the display area
 * @param {HTMLElement[]} cardElements - Array of card DOM elements
 * @returns {gsap.core.Timeline} GSAP timeline
 */
function createCardDealingAnimation(cardElements) {
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
function createCardFlipAnimation(cardElement, cardData) {
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
function triggerRareCardEffects(cardElement, cardData) {
    const rarityLevel = getRarityEffectLevel(cardData.rarity.id);

    if (rarityLevel === 0) return; // Common cards, no special effects

    // Screen shake for SR+
    if (rarityLevel >= 2) {
        screenShake(rarityLevel);
    }

    // Glow pulse for the card
    cardGlowPulse(cardElement, cardData.rarity.id);

    // Screen flash for UR
    if (rarityLevel >= 4) {
        screenFlash();
    }
}

/**
 * Get effect intensity level based on rarity
 * @param {string} rarityId - Rarity ID
 * @returns {number} 0-4 intensity level
 */
function getRarityEffectLevel(rarityId) {
    const levels = { 'c': 0, 'r': 1, 'sr': 2, 'ssr': 3, 'ur': 4 };
    return levels[rarityId] ?? 0;
}

/**
 * Shake the entire screen
 * @param {number} intensity - Shake intensity (1-4)
 */
function screenShake(intensity = 1) {
    const container = document.querySelector('.app-container');
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
function screenFlash() {
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

/**
 * Pulse glow effect on a card
 * @param {HTMLElement} cardElement - Card element
 * @param {string} rarityId - Rarity for color
 */
function cardGlowPulse(cardElement, rarityId) {
    const colors = {
        'r': 'rgba(34, 197, 94, 0.8)',
        'sr': 'rgba(59, 130, 246, 0.8)',
        'ssr': 'rgba(168, 85, 247, 0.8)',
        'ur': 'rgba(250, 204, 21, 0.9)'
    };

    const color = colors[rarityId] || 'rgba(139, 92, 246, 0.6)';

    gsap.fromTo(cardElement,
        { boxShadow: `0 0 0px 0px ${color}` },
        {
            boxShadow: `0 0 40px 15px ${color}`,
            duration: AnimConfig.rare.glowPulseDuration,
            repeat: 2,
            yoyo: true,
            ease: "power2.inOut"
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
function animateHoloShimmer(cardElement, holoType) {
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
function animateCollectionCards(cardElements) {
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
function bounceFeedback(element) {
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
function pulseAttention(element) {
    gsap.to(element, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

// Export for use in game.js (if using modules)
// For now, these are global functions
console.log('✦ GSAP Animations loaded! ✦');
