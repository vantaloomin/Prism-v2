/**
 * PROJECT PRISM - Shop Module
 * Pack opening and shop functionality
 */

import { gsap } from 'gsap';
import { CONFIG, openPack } from './engines/pack-logic.js';
import { gameState, saveGame, updateCreditsDisplay } from './state.js';
import { createCardElement } from './card.js';
import {
    createPackOpeningAnimation,
    createCardDealingAnimation,
    createCardFlipAnimation,
    triggerRareCardEffects,
    AnimConfig,
    bounceFeedback
} from './engines/animations.js';
import { initShaderCanvas, destroyShaderCanvas } from './engines/shader-engine.js';
import { renderCollection } from './collection.js';

// ============================================
// PACK OPENING SEQUENCE
// ============================================

/**
 * Handle pack purchase and opening
 * @param {string} packType - 'waifu' or 'husbando'
 * @param {Function} onFocusClick - Callback for focus mode
 */
export async function handlePackPurchase(packType, onFocusClick) {
    let cost = CONFIG.PACK_COST;
    if (packType === 'debug-frame') cost = CONFIG.FRAME_DEBUG_COST;
    if (packType === 'debug-holo') cost = CONFIG.HOLO_DEBUG_COST;

    if (gameState.credits < cost) {
        console.log('Not enough credits!');
        bounceFeedback(document.getElementById('credits-amount'));
        return;
    }

    // Deduct credits
    gameState.credits -= cost;
    updateCreditsDisplay();

    // Hide shop, show pack animation
    const packShop = document.getElementById('pack-shop');
    const packContainer = document.getElementById('pack-animation-container');
    const packImage = document.getElementById('pack-image');

    packShop.hidden = true;
    packContainer.hidden = false;
    packImage.textContent = packType === 'waifu' ? '🌸' : '⚔️';

    // Reset pack state
    gsap.set(packImage, { scale: 1, rotation: 0, opacity: 1, boxShadow: 'none' });

    // Generate cards (but don't show yet)
    const cards = openPack(packType);

    // Log for debugging
    console.log('Pack opened:', cards.map(c =>
        `${c.name} [${c.rarity.id.toUpperCase()}/${c.frame.id}/${c.holo.id}]`
    ));

    // Pack click triggers GSAP animation sequence
    packImage.onclick = async () => {
        packImage.onclick = null; // Prevent double-clicks

        // Create and play the dramatic pack opening animation
        const openingTimeline = createPackOpeningAnimation(packImage);

        openingTimeline.eventCallback('onComplete', () => {
            // Hide pack container
            packContainer.hidden = true;

            // Render cards (face down initially)
            renderCardDisplayAnimated(cards, onFocusClick);

            // Add cards to inventory
            gameState.inventory.push(...cards);
            gameState.stats.packsOpened++;
            gameState.stats.totalCards += cards.length;

            // Save and update collection
            saveGame();
            renderCollection(null, onFocusClick);
        });
    };
}

/**
 * Render card display with GSAP dealing animation
 * @param {Array} cards - Card data array
 * @param {Function} onFocusClick - Callback for focus mode
 */
function renderCardDisplayAnimated(cards, onFocusClick) {
    const displayArea = document.getElementById('card-display-area');
    displayArea.innerHTML = '';

    // Create card row container for horizontal layout
    const cardRow = document.createElement('div');
    cardRow.className = 'card-row';
    cardRow.style.cssText = 'display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;';
    displayArea.appendChild(cardRow);

    // Create card elements inside the row
    const cardElements = cards.map((cardData, index) => {
        const cardElement = createCardElement(cardData, true, onFocusClick); // Face down
        cardRow.appendChild(cardElement);
        return { element: cardElement, data: cardData, index };
    });

    // Create continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-button';
    continueBtn.textContent = 'Continue';
    continueBtn.hidden = true;
    displayArea.appendChild(continueBtn);

    continueBtn.addEventListener('click', () => {
        showPackShop();
    });

    // Animate cards dealing in
    const dealTimeline = createCardDealingAnimation(
        cardElements.map(c => c.element)
    );

    // After dealing, flip cards one by one with stagger
    dealTimeline.eventCallback('onComplete', () => {
        let flipped = 0;

        cardElements.forEach(({ element, data }, index) => {
            setTimeout(() => {
                // Create flip animation
                const flipTl = createCardFlipAnimation(element, data);

                // Add is-flipped class for CSS state
                element.classList.add('is-flipped');

                // Trigger rare effects after flip completes
                flipTl.eventCallback('onComplete', () => {
                    triggerRareCardEffects(element, data);

                    // Initialize shader immediately for revealed cards
                    initShaderCanvas(element, data);

                    flipped++;
                    // Show continue button after all cards flipped
                    if (flipped === cardElements.length) {
                        continueBtn.hidden = false;
                        gsap.from(continueBtn, {
                            y: 20,
                            opacity: 0,
                            duration: 0.3,
                            ease: "back.out"
                        });
                    }
                });
            }, index * (AnimConfig.cards.flipDelay * 1000 + AnimConfig.cards.flipStagger * 1000));
        });
    });
}

/**
 * Show the pack shop again
 */
export function showPackShop() {
    // Clean up any active shaders before leaving
    destroyShaderCanvas();

    const packShop = document.getElementById('pack-shop');
    const displayArea = document.getElementById('card-display-area');

    displayArea.innerHTML = '';
    packShop.hidden = false;
}
