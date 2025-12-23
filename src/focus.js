/**
 * AETHAL SAGA - Focus Module
 * Card focus/inspection overlay
 */

import { createCardElement, calculateOddsString } from './card.js';
import { initShaderCanvas, destroyShaderCanvasForCard } from './engines/shader-engine.js';
import { initShadersForVisibleCards } from './collection.js';
import { getCharacterLore } from './engines/pack-loader.js';

// ============================================
// FOCUS MODE STATE
// ============================================

let focusedCardData = null;

// ============================================
// LORE DATA
// ============================================

/**
 * Load lore data for a character from their pack's lore.json
 * @param {string} packType - Pack ID (e.g., 'waifu', 'husbando')
 * @param {string} characterId - Character ID (e.g., 'w01', 'h15')
 * @returns {Promise<Object|null>} Lore data for the character
 */
async function loadLoreData(packType, characterId) {
    // Use pack-loader to get lore from the pack's lore.json
    return await getCharacterLore(packType, characterId);
}

// ============================================
// FOCUS MODE UI
// ============================================

/**
 * Open card focus mode to inspect a card
 * @param {Object} cardData - The card data to display
 */
export async function openFocusMode(cardData) {
    focusedCardData = cardData;

    const overlay = document.getElementById('card-focus-overlay');
    const cardWrapper = document.getElementById('focus-card-wrapper');
    const infoPanel = document.getElementById('focus-info');

    // Create the focused card element
    const focusedCard = createCardElement(cardData, false, null);
    focusedCard.classList.add('is-flipped'); // Always show front

    // Clear and add card
    cardWrapper.innerHTML = '';
    cardWrapper.appendChild(focusedCard);

    // Initialize WebGL shader overlay for high-quality effects (with mouse tracking in Focus)
    setTimeout(() => {
        initShaderCanvas(focusedCard, cardData, true); // focusMode = true for mouse tracking
    }, 100);

    // Load lore data from the pack's lore.json
    const lore = await loadLoreData(cardData.packType, cardData.characterId);

    // Populate info panel with tabs
    infoPanel.innerHTML = `
        <h3>${cardData.name}</h3>
        
        <!-- Tab Buttons -->
        <div class="focus-info-tabs">
            <button class="focus-tab-btn active" data-tab="stats">
                <span class="tab-icon">📊</span> Stats
            </button>
            <button class="focus-tab-btn" data-tab="lore">
                <span class="tab-icon">📜</span> Lore
            </button>
        </div>
        
        <!-- Stats Tab Content -->
        <div class="focus-tab-content active" id="focus-tab-stats">
            <div class="focus-info-row">
                <span class="focus-info-label">Rarity</span>
                <span class="focus-info-value rarity-${cardData.rarity.id}">${cardData.rarity.name}</span>
            </div>
            <div class="focus-info-row">
                <span class="focus-info-label">Frame</span>
                <span class="focus-info-value">${cardData.frame.name}</span>
            </div>
            <div class="focus-info-row">
                <span class="focus-info-label">Holographic</span>
                <span class="focus-info-value">${cardData.holo.name}</span>
            </div>
            <div class="focus-info-row">
                <span class="focus-info-label">Pack Type</span>
                <span class="focus-info-value">${cardData.packType}</span>
            </div>
            <div class="focus-info-row focus-info-odds">
                <span class="focus-info-label">Combo Odds</span>
                <span class="focus-info-value">${calculateOddsString(cardData)}</span>
            </div>
            <div class="focus-info-row">
                <span class="focus-info-label">Card ID</span>
                <span class="focus-info-value" style="font-size: 0.75rem; font-family: monospace;">${cardData.id.slice(-12)}</span>
            </div>
        </div>
        
        <!-- Lore Tab Content -->
        <div class="focus-tab-content" id="focus-tab-lore">
            ${lore ? `
                <div class="focus-lore-quote">${lore.quote}</div>
                
                <div class="focus-lore-section">
                    <div class="focus-lore-section-title">Origin</div>
                    <div class="focus-lore-section-content">${lore.origin}</div>
                </div>
                
                <div class="focus-lore-section">
                    <div class="focus-lore-section-title">Story</div>
                    <div class="focus-lore-section-content">${lore.story}</div>
                </div>
                
                <div class="focus-lore-section">
                    <div class="focus-lore-section-title">Abilities</div>
                    <div class="focus-lore-abilities">
                        ${lore.abilities.split(', ').map(ability =>
        `<span class="focus-lore-ability">${ability}</span>`
    ).join('')}
                    </div>
                </div>
            ` : `
                <div class="focus-lore-section">
                    <div class="focus-lore-section-content" style="text-align: center; color: var(--text-muted);">
                        Lore data not available for this character.
                    </div>
                </div>
            `}
        </div>
    `;

    // Bind tab switching
    infoPanel.querySelectorAll('.focus-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            infoPanel.querySelectorAll('.focus-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            infoPanel.querySelectorAll('.focus-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`focus-tab-${tabId}`).classList.add('active');
        });
    });

    // Show overlay
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Add mouse tracking for interactive holo
    focusedCard.addEventListener('mousemove', handleFocusMouseMove);
    focusedCard.addEventListener('mouseleave', handleFocusMouseLeave);
}

/**
 * Handle mouse movement over focused card for interactive effects
 * @param {MouseEvent} e 
 */
function handleFocusMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    // Calculate mouse position as percentage (0-100)
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Update CSS custom properties for light position
    card.style.setProperty('--light-x', `${x}%`);
    card.style.setProperty('--light-y', `${y}%`);

    // Calculate tilt angles (max 15 degrees)
    const tiltX = ((y - 50) / 50) * -15;
    const tiltY = ((x - 50) / 50) * 15;

    // Apply 3D transform
    card.classList.add('tilt-active');
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    // Update holo layer position if it exists
    const holoLayer = card.querySelector('.card-layer-holo');
    if (holoLayer) {
        holoLayer.style.setProperty('--light-x', `${x}%`);
        holoLayer.style.setProperty('--light-y', `${y}%`);
    }
}

/**
 * Reset card when mouse leaves
 * @param {MouseEvent} e 
 */
function handleFocusMouseLeave(e) {
    const card = e.currentTarget;
    card.classList.remove('tilt-active');
    card.style.transform = '';
    card.style.setProperty('--light-x', '50%');
    card.style.setProperty('--light-y', '50%');
}

/**
 * Close the focus mode overlay
 */
export function closeFocusMode() {
    // Only destroy the focused card's shader, not all shaders
    const focusWrapper = document.getElementById('focus-card-wrapper');
    const focusCard = focusWrapper ? focusWrapper.querySelector('.card') : null;

    if (focusCard) {
        destroyShaderCanvasForCard(focusCard);
    }

    const overlay = document.getElementById('card-focus-overlay');
    overlay.hidden = true;
    document.body.style.overflow = '';
    focusedCardData = null;

    // Re-initialize shaders for visible collection cards (they may have been affected)
    requestAnimationFrame(() => {
        initShadersForVisibleCards();
    });
}

/**
 * Get the currently focused card data
 */
export function getFocusedCardData() {
    return focusedCardData;
}
