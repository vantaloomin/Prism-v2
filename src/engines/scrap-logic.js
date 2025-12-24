/**
 * AETHAL SAGA - Scrap Logic Engine
 * Handles card scrapping calculations and state mutations
 */

import { gameState, saveGame, updateCreditsDisplay } from '../state.js';
import { getCardGroupKey } from '../card.js';

// ============================================
// SCRAP VALUE TABLES
// ============================================

// Base rarity scrap values (in gems)
const RARITY_SCRAP_VALUES = {
    c: 5,       // Common
    r: 15,      // Rare
    sr: 40,     // Super Rare
    ssr: 100,   // Super Special Rare
    ur: 250     // Ultra Rare
};

// Frame bonus values
const FRAME_BONUS = {
    white: 0,
    blue: 2,
    red: 5,
    gold: 15,
    rainbow: 30,
    black: 50
};

// Holographic effect bonus values
const HOLO_BONUS = {
    none: 0,
    shiny: 5,
    rainbow: 10,
    pearl: 20,
    fractal: 40,
    void: 75
};

// ============================================
// SCRAP VALUE CALCULATION
// ============================================

/**
 * Calculate the scrap value for a single card
 * Formula: Base Rarity + Frame Bonus + Holo Bonus
 * @param {Object} card - The card data object
 * @returns {number} Total gem value for scrapping this card
 */
export function calculateScrapValue(card) {
    const rarityValue = RARITY_SCRAP_VALUES[card.rarity.id] || 0;
    const frameBonus = FRAME_BONUS[card.frame.id] || 0;
    const holoBonus = HOLO_BONUS[card.holo.id] || 0;

    return rarityValue + frameBonus + holoBonus;
}

/**
 * Calculate scrap value for multiple cards of the same type
 * @param {Object} card - The card data object
 * @param {number} quantity - Number of cards to scrap
 * @returns {number} Total gem value
 */
export function calculateBulkScrapValue(card, quantity) {
    return calculateScrapValue(card) * quantity;
}

// ============================================
// SCRAP OPERATIONS
// ============================================

/**
 * Scrap a single card by its ID
 * @param {string} cardId - The unique ID of the card to scrap
 * @returns {Object|null} Result object with scrapped card and gem value, or null if not found
 */
export function scrapCard(cardId) {
    const cardIndex = gameState.inventory.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
        console.warn('Card not found for scrapping:', cardId);
        return null;
    }

    const card = gameState.inventory[cardIndex];
    const gemValue = calculateScrapValue(card);

    // Remove card from inventory
    gameState.inventory.splice(cardIndex, 1);

    // Add gems to credits
    gameState.credits += gemValue;

    // Update stats
    if (!gameState.stats.totalScrapped) {
        gameState.stats.totalScrapped = 0;
    }
    gameState.stats.totalScrapped++;

    // Persist and update UI
    saveGame();
    updateCreditsDisplay();

    console.log(`♻️ Scrapped card "${card.name}" for ${gemValue} gems`);

    return {
        card,
        gemValue
    };
}

/**
 * Scrap multiple cards from a group (keeping at least one)
 * @param {string} groupKey - The group key (characterId_frameId_holoId)
 * @param {number} quantity - Number of cards to scrap
 * @returns {Object} Result object with count scrapped and total gem value
 */
export function scrapFromGroup(groupKey, quantity) {
    // Find all cards matching the group key
    const matchingCards = gameState.inventory.filter(card =>
        getCardGroupKey(card) === groupKey
    );

    if (matchingCards.length === 0) {
        console.warn('No cards found for group:', groupKey);
        return { count: 0, totalValue: 0 };
    }

    // Ensure we keep at least one card
    const maxScrappable = matchingCards.length - 1;
    const actualQuantity = Math.min(quantity, maxScrappable);

    if (actualQuantity <= 0) {
        console.warn('Cannot scrap: would remove last copy');
        return { count: 0, totalValue: 0 };
    }

    // Calculate value (all cards in group have same value)
    const cardValue = calculateScrapValue(matchingCards[0]);
    const totalValue = cardValue * actualQuantity;

    // Remove the specified quantity of cards
    let scrappedCount = 0;
    for (let i = 0; i < actualQuantity; i++) {
        const cardToRemove = gameState.inventory.find(card =>
            getCardGroupKey(card) === groupKey
        );
        if (cardToRemove) {
            const idx = gameState.inventory.indexOf(cardToRemove);
            gameState.inventory.splice(idx, 1);
            scrappedCount++;
        }
    }

    // Add gems to credits
    gameState.credits += totalValue;

    // Update stats
    if (!gameState.stats.totalScrapped) {
        gameState.stats.totalScrapped = 0;
    }
    gameState.stats.totalScrapped += scrappedCount;

    // Persist and update UI
    saveGame();
    updateCreditsDisplay();

    console.log(`♻️ Scrapped ${scrappedCount} cards for ${totalValue} gems`);

    return {
        count: scrappedCount,
        totalValue
    };
}

/**
 * Scrap all duplicates from a group (keeping exactly one)
 * @param {string} groupKey - The group key (characterId_frameId_holoId)
 * @returns {Object} Result object with count scrapped and total gem value
 */
export function scrapAllDuplicates(groupKey) {
    const matchingCards = gameState.inventory.filter(card =>
        getCardGroupKey(card) === groupKey
    );

    if (matchingCards.length <= 1) {
        return { count: 0, totalValue: 0 };
    }

    // Scrap all but one
    return scrapFromGroup(groupKey, matchingCards.length - 1);
}

/**
 * Get the maximum number of cards that can be scrapped from a group
 * @param {string} groupKey - The group key
 * @returns {number} Maximum scrappable count (total - 1)
 */
export function getMaxScrappable(groupKey) {
    const matchingCards = gameState.inventory.filter(card =>
        getCardGroupKey(card) === groupKey
    );
    return Math.max(0, matchingCards.length - 1);
}
