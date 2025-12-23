/* ============================================
   AETHAL SAGA - PACK GENERATION LOGIC
   ============================================ 
   
   This module handles card generation using dynamic pack data.
   Character pools are loaded from pack manifests at runtime.
*/

import {
    buildCharacterPools,
    getCharacterPath,
    getBackgroundPath,
    getAllPackIds
} from './pack-loader.js';

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

export const CONFIG = {
    PACK_COST: 100,
    PACK_SIZE: 5,
    FRAME_DEBUG_COST: 50,
    HOLO_DEBUG_COST: 150,
    STARTING_CREDITS: 1000,
    STORAGE_KEY: 'prism_save_data'
};

// Probability tables from PRD (values are cumulative thresholds)
// prob = actual probability for odds calculation
export const RARITY_TABLE = [
    { id: 'c', name: 'Common', threshold: 0.50, prob: 0.50, color: '#9ca3af' },
    { id: 'r', name: 'Rare', threshold: 0.80, prob: 0.30, color: '#3b82f6' },
    { id: 'sr', name: 'Super Rare', threshold: 0.94, prob: 0.14, color: '#a855f7' },
    { id: 'ssr', name: 'Super Special Rare', threshold: 0.99, prob: 0.05, color: '#f59e0b' },
    { id: 'ur', name: 'Ultra Rare', threshold: 1.00, prob: 0.01, color: '#ef4444' }
];

export const FRAME_TABLE = [
    { id: 'white', name: 'White', threshold: 0.500, prob: 0.50 },
    { id: 'blue', name: 'Blue', threshold: 0.800, prob: 0.30 },
    { id: 'red', name: 'Red', threshold: 0.950, prob: 0.15 },
    { id: 'gold', name: 'Gold', threshold: 0.9855, prob: 0.0355 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.9955, prob: 0.01 },
    { id: 'black', name: 'Black', threshold: 1.000, prob: 0.0045 }
];

export const HOLO_TABLE = [
    { id: 'none', name: 'None', threshold: 0.60, prob: 0.60 },
    { id: 'shiny', name: 'Shiny', threshold: 0.80, prob: 0.20 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.90, prob: 0.10 },
    { id: 'pearl', name: 'Pearlescent', threshold: 0.98, prob: 0.08 },
    { id: 'fractal', name: 'Fractal', threshold: 0.9955, prob: 0.0155 },
    { id: 'void', name: 'Void', threshold: 1.000, prob: 0.0045 }
];

// ============================================
// DYNAMIC CHARACTER POOLS
// ============================================

// Character pools built dynamically from loaded packs
// Call initializeCharacterPools() after packs are loaded
export let CHARACTER_POOLS = {};

/**
 * Initialize character pools from loaded pack data
 * Must be called after loadAllPacks() completes
 */
export function initializeCharacterPools() {
    CHARACTER_POOLS = buildCharacterPools();
    console.log('✦ Character pools initialized:', Object.keys(CHARACTER_POOLS));
}

// ============================================
// RNG ENGINE (3-Axis Roller)
// ============================================

/**
 * Generic weighted roll function
 * @param {Array} table - Array of {id, name, threshold} objects
 * @returns {Object} The selected entry from the table
 */
export function weightedRoll(table) {
    const roll = Math.random();
    for (const entry of table) {
        if (roll < entry.threshold) {
            return entry;
        }
    }
    // Fallback to last entry (shouldn't happen with proper thresholds)
    return table[table.length - 1];
}

/**
 * Roll for card rarity
 * @returns {Object} Rarity data
 */
export function rollRarity() {
    return weightedRoll(RARITY_TABLE);
}

/**
 * Roll for frame style
 * @returns {Object} Frame data
 */
export function rollFrame() {
    return weightedRoll(FRAME_TABLE);
}

/**
 * Roll for holographic effect
 * @returns {Object} Holo data
 */
export function rollHolo() {
    return weightedRoll(HOLO_TABLE);
}

/**
 * Generate a unique card ID
 * @returns {string} UUID-like string
 */
function generateCardId() {
    return 'card_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a single card with proper rarity-based character selection
 * First rolls rarity, then picks a character of that rarity tier
 * @param {string} packType - Pack ID (e.g., 'waifu', 'husbando')
 * @returns {Object} Complete card data
 */
export function generateCard(packType) {
    // Roll for rarity tier first
    const rarityRoll = rollRarity();
    const frame = rollFrame();
    const holo = rollHolo();

    // Get all characters of this rarity from the pool
    const pool = CHARACTER_POOLS[packType];
    if (!pool) {
        throw new Error(`Unknown pack type: ${packType}`);
    }

    const eligibleCharacters = pool.filter(c => c.rarity === rarityRoll.id);

    // Pick a random character from eligible pool
    // If no characters of that rarity exist (shouldn't happen), fallback to full pool
    const characterPool = eligibleCharacters.length > 0 ? eligibleCharacters : pool;
    const character = characterPool[Math.floor(Math.random() * characterPool.length)];

    // Get the full rarity data object (not just the ID)
    const rarity = RARITY_TABLE.find(r => r.id === character.rarity);

    // Calculate combined probability (Rarity % * Frame % * Holo %)
    // This represents the true statistical rarity of this specific card combo
    const combinedProb = rarity.prob * frame.prob * holo.prob;

    return {
        id: generateCardId(),
        characterId: character.id,
        name: character.name,
        packType: packType,
        rarity: rarity,
        frame: frame,
        holo: holo,
        combinedProb: combinedProb,
        // Use pack-relative paths from pack-loader
        backgroundPath: getBackgroundPath(packType, character.bg),
        characterPath: getCharacterPath(packType, character.id),
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for Frame Testing
 * Uses first available pack's first rare character
 */
function generateFrameDebugCard(frameId) {
    const packIds = getAllPackIds();
    const packType = packIds[0] || 'waifu';
    const pool = CHARACTER_POOLS[packType] || [];

    // Find a rare character for testing
    const character = pool.find(c => c.rarity === 'r') || pool[0];
    if (!character) {
        throw new Error('No characters available for debug card');
    }

    const rarity = RARITY_TABLE.find(r => r.id === character.rarity);
    const frame = FRAME_TABLE.find(f => f.id === frameId);
    const holo = HOLO_TABLE.find(h => h.id === 'none');

    return {
        id: generateCardId(),
        characterId: character.id,
        name: character.name,
        packType: 'debug-frame',
        rarity: rarity,
        frame: frame,
        holo: holo,
        combinedProb: 0,
        backgroundPath: getBackgroundPath(packType, character.bg),
        characterPath: getCharacterPath(packType, character.id),
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for Holo Testing
 * Uses first available pack's first rare character
 */
function generateHoloDebugCard(holoId) {
    const packIds = getAllPackIds();
    const packType = packIds[0] || 'waifu';
    const pool = CHARACTER_POOLS[packType] || [];

    // Find a rare character for testing
    const character = pool.find(c => c.rarity === 'r') || pool[0];
    if (!character) {
        throw new Error('No characters available for debug card');
    }

    const rarity = RARITY_TABLE.find(r => r.id === character.rarity);
    const frame = FRAME_TABLE.find(f => f.id === 'white');
    const holo = HOLO_TABLE.find(h => h.id === holoId);

    return {
        id: generateCardId(),
        characterId: character.id,
        name: character.name,
        packType: 'debug-holo',
        rarity: rarity,
        frame: frame,
        holo: holo,
        combinedProb: 0,
        backgroundPath: getBackgroundPath(packType, character.bg),
        characterPath: getCharacterPath(packType, character.id),
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for God Pack
 * Guaranteed UR/SSR tier with rainbow/black frames and rare holos
 */
function generateDebugCard() {
    // Collect all UR/SSR characters from all packs
    const urCharacters = [];
    for (const [packType, pool] of Object.entries(CHARACTER_POOLS)) {
        for (const char of pool) {
            if (char.rarity === 'ur' || char.rarity === 'ssr') {
                urCharacters.push({ ...char, packType });
            }
        }
    }

    if (urCharacters.length === 0) {
        throw new Error('No UR/SSR characters available for debug card');
    }

    const charData = urCharacters[Math.floor(Math.random() * urCharacters.length)];
    const rarity = RARITY_TABLE.find(r => r.id === charData.rarity);

    // God pack: rare frames only (gold, rainbow, black)
    const rareFrames = ['gold', 'rainbow', 'black'];
    const frameId = rareFrames[Math.floor(Math.random() * rareFrames.length)];
    const frame = FRAME_TABLE.find(f => f.id === frameId);

    // God pack: rare holos only (pearl, fractal, void)
    const rareHolos = ['pearl', 'fractal', 'void'];
    const holoId = rareHolos[Math.floor(Math.random() * rareHolos.length)];
    const holo = HOLO_TABLE.find(h => h.id === holoId);

    return {
        id: generateCardId(),
        characterId: charData.id,
        name: charData.name,
        packType: charData.packType,
        rarity: rarity,
        frame: frame,
        holo: holo,
        combinedProb: 0,
        backgroundPath: getBackgroundPath(charData.packType, charData.bg),
        characterPath: getCharacterPath(charData.packType, charData.id),
        obtainedAt: Date.now()
    };
}

/**
 * Open a pack and generate cards
 * @param {string} packType - Pack ID or debug type ('debug', 'debug-frame', 'debug-holo')
 * @returns {Array} Array of generated cards
 */
export function openPack(packType) {
    const cards = [];

    if (packType === 'debug-frame') {
        const frames = ['white', 'blue', 'red', 'gold', 'rainbow', 'black'];
        frames.forEach(frameId => {
            cards.push(generateFrameDebugCard(frameId));
        });
    } else if (packType === 'debug-holo') {
        const holos = ['none', 'shiny', 'rainbow', 'pearl', 'fractal', 'void'];
        holos.forEach(holoId => {
            cards.push(generateHoloDebugCard(holoId));
        });
    } else if (packType === 'debug') {
        for (let i = 0; i < CONFIG.PACK_SIZE; i++) {
            cards.push(generateDebugCard());
        }
    } else {
        for (let i = 0; i < CONFIG.PACK_SIZE; i++) {
            cards.push(generateCard(packType));
        }
    }
    return cards;
}
