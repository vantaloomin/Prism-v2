/**
 * AETHAL SAGA - Shop Module
 * Pack opening and shop functionality with dynamic pack loading
 */

import { gsap } from 'gsap';
import { CONFIG, openPack } from './engines/pack-logic.js';
import { getAllEnabledPacks, getPackIconPath, getPackById } from './engines/pack-loader.js';
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
// MODULE STATE
// ============================================

let currentFocusCallback = null;

// ============================================
// PACK SHOP INITIALIZATION
// ============================================

/**
 * Initialize the pack shop with dynamically generated buttons
 * @param {Function} onFocusClick - Callback for focus mode
 */
export function initPackShop(onFocusClick) {
    currentFocusCallback = onFocusClick;

    const container = document.getElementById('pack-buttons-container');
    if (!container) {
        console.error('Pack buttons container not found');
        return;
    }

    // Clear existing buttons
    container.innerHTML = '';

    // Get enabled packs and generate buttons
    const packs = getAllEnabledPacks();

    packs.forEach(pack => {
        const button = createPackButton(pack);
        container.appendChild(button);
    });

    // Add debug pack buttons (always at the end)
    addDebugPackButtons(container);

    console.log(`✦ Pack Shop initialized with ${packs.length} packs ✦`);
}

/**
 * Create a pack button element
 * @param {Object} pack - Pack data from manifest
 * @returns {HTMLElement} Button element
 */
function createPackButton(pack) {
    const button = document.createElement('button');
    button.className = `pack-button ${pack.id}-pack`;
    button.id = `btn-${pack.id}-pack`;
    button.dataset.packType = pack.id;
    button.dataset.cost = pack.cost || CONFIG.PACK_COST;

    const iconPath = getPackIconPath(pack.id);
    const cost = pack.cost || CONFIG.PACK_COST;

    button.innerHTML = `
        <div class="pack-icon"><img src="${iconPath}" alt="${pack.name}" style="width: 300px; height: auto; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.textContent='📦';"></div>
    `;

    button.addEventListener('click', () => {
        handlePackPurchase(pack.id, currentFocusCallback, cost);
    });

    // Update disabled state based on credits
    updatePackButtonState(button, cost);

    return button;
}

/**
 * Add debug pack buttons to the container
 * @param {HTMLElement} container - Container element
 */
function addDebugPackButtons(container) {
    const debugPacks = [
        { id: 'debug', name: 'God Pack', emoji: '⚡', cost: CONFIG.PACK_COST, borderColor: '#ffd700', bg: 'rgba(50,40,0,0.9)' },
        { id: 'debug-frame', name: 'Frame Test', emoji: '🖼️', cost: CONFIG.FRAME_DEBUG_COST, borderColor: '#a855f7', bg: 'rgba(40,0,50,0.9)' },
        { id: 'debug-holo', name: 'Holo Test', emoji: '✨', cost: CONFIG.HOLO_DEBUG_COST, borderColor: '#3b82f6', bg: 'rgba(0,40,50,0.9)' }
    ];

    debugPacks.forEach(debug => {
        const button = document.createElement('button');
        button.className = 'pack-button debug-pack-btn';
        button.id = `btn-${debug.id}-pack`;
        button.dataset.packType = debug.id;
        button.dataset.cost = debug.cost;
        button.style.borderColor = debug.borderColor;
        button.style.background = `linear-gradient(145deg, rgba(20,20,20,0.9), ${debug.bg})`;

        button.innerHTML = `
            <div class="pack-icon">${debug.emoji}</div>
            <div class="pack-name">${debug.name}</div>
        `;

        button.addEventListener('click', () => {
            handlePackPurchase(debug.id, currentFocusCallback, debug.cost);
        });

        // Hide by default unless debug mode is enabled
        const debugMode = localStorage.getItem('debugMode') === 'true';
        button.style.display = debugMode ? '' : 'none';

        container.appendChild(button);
    });
}

/**
 * Update pack button disabled state based on credits
 * @param {HTMLElement} button - Button element
 * @param {number} cost - Pack cost
 */
function updatePackButtonState(button, cost) {
    button.disabled = gameState.credits < cost;
}

/**
 * Update all pack button states (call after credits change)
 */
export function updateAllPackButtonStates() {
    const packs = getAllEnabledPacks();

    packs.forEach(pack => {
        const button = document.getElementById(`btn-${pack.id}-pack`);
        if (button) {
            updatePackButtonState(button, pack.cost || CONFIG.PACK_COST);
        }
    });

    // Update debug buttons
    const debugCosts = {
        'debug': CONFIG.PACK_COST,
        'debug-frame': CONFIG.FRAME_DEBUG_COST,
        'debug-holo': CONFIG.HOLO_DEBUG_COST
    };

    for (const [id, cost] of Object.entries(debugCosts)) {
        const button = document.getElementById(`btn-${id}-pack`);
        if (button) {
            updatePackButtonState(button, cost);
        }
    }
}

// ============================================
// PACK OPENING SEQUENCE
// ============================================

/**
 * Handle pack purchase and opening
 * @param {string} packType - Pack ID or debug type
 * @param {Function} onFocusClick - Callback for focus mode
 * @param {number} cost - Cost of the pack
 */
export async function handlePackPurchase(packType, onFocusClick, cost = CONFIG.PACK_COST) {
    if (gameState.credits < cost) {
        console.log('Not enough credits!');
        bounceFeedback(document.getElementById('credits-amount'));
        return;
    }

    // Deduct credits
    gameState.credits -= cost;
    updateCreditsDisplay();
    updateAllPackButtonStates();

    // Hide shop, show pack animation
    const packShop = document.getElementById('pack-shop');
    const packContainer = document.getElementById('pack-animation-container');
    const packImage = document.getElementById('pack-image');

    packShop.hidden = true;
    packContainer.hidden = false;

    // Set pack image based on pack type
    const isDebugPack = packType.startsWith('debug');

    if (!isDebugPack) {
        // Regular pack - use pack icon
        const imgPath = getPackIconPath(packType);
        packImage.innerHTML = `<img src="${imgPath}" alt="${packType} Pack" style="max-width: 300px; height: auto; border-radius: 12px;">`;
        packImage.style.background = 'transparent';
    } else {
        // Debug packs use emoji
        const emojiMap = {
            'debug': '⚡',
            'debug-frame': '🖼️',
            'debug-holo': '✨'
        };
        packImage.innerHTML = '';
        packImage.textContent = emojiMap[packType] || '🎁';
        packImage.style.background = 'linear-gradient(145deg, var(--accent-primary), #ec4899)';
    }

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

/**
 * Toggle debug pack visibility
 * @param {boolean} show - Whether to show debug packs
 */
export function toggleDebugPacks(show) {
    document.querySelectorAll('.debug-pack-btn').forEach(btn => {
        btn.style.display = show ? '' : 'none';
    });
}
