/**
 * PROJECT PRISM - Card Module
 * Card DOM creation and utilities
 */

import { gameState } from './state.js';

// ============================================
// CARD DOM CREATION
// ============================================

/**
 * Create a card DOM element from card data
 * @param {Object} cardData - The card data object
 * @param {boolean} faceDown - Whether to show face down initially
 * @param {Function} onFocusClick - Callback when card is clicked for focus mode
 * @returns {HTMLElement} The card element
 */
export function createCardElement(cardData, faceDown = true, onFocusClick = null) {
    const card = document.createElement('div');
    card.className = `card rarity-${cardData.rarity.id} frame-${cardData.frame.id} holo-${cardData.holo.id}`;
    if (!faceDown) {
        card.classList.add('is-flipped');
    }
    card.dataset.cardId = cardData.id;

    card.innerHTML = `
        <div class="card-inner">
            <!-- Card Back -->
            <div class="card-face card-back"></div>
            
            <!-- Card Front (Layered) -->
            <div class="card-face card-front">
                <!-- Z-1: Background Image (frame hue affects this) -->
                <div class="card-layer-bg">
                    <img src="${cardData.backgroundPath}" alt="Background" class="card-bg-img" onerror="this.style.display='none'">
                    <div class="card-bg-tint"></div>
                </div>
                
                <!-- Z-2: Character Art (no tint, sits on top of background) -->
                <div class="card-layer-character">
                    <img src="${cardData.characterPath}" alt="${cardData.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 150%22><text x=%2250%22 y=%2275%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2210%22>${cardData.name}</text></svg>'">
                </div>
                
                <!-- Z-3: Frame (border only, sits on top of character) -->
                <div class="card-layer-frame"></div>
                
                <!-- Z-4: Holo Overlay (covers entire card) -->
                <div class="card-layer-holo"></div>
                
                <!-- Z-4.5: Frame Tint Overlay (above holo, masked to protect character) -->
                <div class="card-layer-tint-overlay"></div>
                
                <!-- Z-5: Stats/UI -->
                <div class="card-layer-stats">
                    <div class="card-name">
                        <span class="card-rarity">${cardData.rarity.id.toUpperCase()}</span>
                        <span class="card-name-text">${cardData.name}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add flip interaction (or focus mode if already flipped)
    card.addEventListener('click', (e) => {
        // Don't trigger if we're in focus mode
        if (document.getElementById('card-focus-overlay')?.hidden === false) {
            return;
        }

        if (!card.classList.contains('is-flipped')) {
            // Card is face-down, flip it
            card.classList.add('is-flipped');
            // Check for special reveals
            if (cardData.rarity.id === 'ur' || cardData.holo.id === 'void') {
                triggerSpecialReveal(card, cardData);
            }
        } else if (onFocusClick) {
            // Card is already face-up, open focus mode
            onFocusClick(cardData);
        }
    });

    return card;
}

/**
 * Trigger special effects for rare cards
 * @param {HTMLElement} cardElement - The card DOM element
 * @param {Object} cardData - The card data
 */
export function triggerSpecialReveal(cardElement, cardData) {
    // Add screen shake for UR
    if (cardData.rarity.id === 'ur') {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }

    // Could add confetti, sound effects, etc. here
    console.log('🎉 Special reveal:', cardData.rarity.name, cardData.frame.name, cardData.holo.name);
}

// ============================================
// UTILITIES
// ============================================

/**
 * Calculate the combined odds of a card's rarity/frame/holo combo
 * @param {Object} cardData - The card data object
 * @returns {string} Formatted odds string like "1 : 5,000,000"
 */
export function calculateOddsString(cardData) {
    const rarityProb = cardData.rarity.prob;
    const frameProb = cardData.frame.prob;
    const holoProb = cardData.holo.prob;

    // Combined probability = multiply all three
    const combinedProb = rarityProb * frameProb * holoProb;

    // Convert to 1:X odds
    const odds = Math.round(1 / combinedProb);

    // Format with commas for readability
    const formattedOdds = odds.toLocaleString();

    return `1 : ${formattedOdds}`;
}

/**
 * Get sort order value for rarity (Common first → UR last, like a binder)
 */
export function getRaritySortOrder(rarityId) {
    const order = { 'c': 0, 'r': 1, 'sr': 2, 'ssr': 3, 'ur': 4 };
    return order[rarityId] ?? -1;
}

/**
 * Get sort order value for frame (White first → Black last)
 */
export function getFrameSortOrder(frameId) {
    const order = { 'white': 0, 'blue': 1, 'red': 2, 'gold': 3, 'rainbow': 4, 'black': 5 };
    return order[frameId] ?? -1;
}

/**
 * Get sort order value for holo (None first → Void last)
 */
export function getHoloSortOrder(holoId) {
    const order = { 'none': 0, 'shiny': 1, 'rainbow': 2, 'pearl': 3, 'fractal': 4, 'void': 5 };
    return order[holoId] ?? -1;
}

/**
 * Generate a unique key for grouping duplicate cards
 */
export function getCardGroupKey(card) {
    return `${card.characterId}_${card.frame.id}_${card.holo.id}`;
}

/**
 * Sleep utility for animations
 * @param {number} ms - Milliseconds to wait
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
