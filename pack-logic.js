/* ============================================
   PROJECT PRISM - PACK GENERATION LOGIC
   ============================================ */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const CONFIG = {
    PACK_COST: 100,
    PACK_SIZE: 5,
    FRAME_DEBUG_COST: 50,
    HOLO_DEBUG_COST: 150,
    STARTING_CREDITS: 1000,
    STORAGE_KEY: 'prism_save_data'
};

// Probability tables from PRD (values are cumulative thresholds)
// prob = actual probability for odds calculation
const RARITY_TABLE = [
    { id: 'c', name: 'Common', threshold: 0.50, prob: 0.50, color: '#9ca3af' },
    { id: 'r', name: 'Rare', threshold: 0.80, prob: 0.30, color: '#3b82f6' },
    { id: 'sr', name: 'Super Rare', threshold: 0.94, prob: 0.14, color: '#a855f7' },
    { id: 'ssr', name: 'Super Special Rare', threshold: 0.99, prob: 0.05, color: '#f59e0b' },
    { id: 'ur', name: 'Ultra Rare', threshold: 1.00, prob: 0.01, color: '#ef4444' }
];

const FRAME_TABLE = [
    { id: 'white', name: 'White', threshold: 0.500, prob: 0.50 },
    { id: 'blue', name: 'Blue', threshold: 0.800, prob: 0.30 },
    { id: 'red', name: 'Red', threshold: 0.950, prob: 0.15 },
    { id: 'gold', name: 'Gold', threshold: 0.9855, prob: 0.0355 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.9955, prob: 0.01 },
    { id: 'black', name: 'Black', threshold: 1.000, prob: 0.0045 }
];

const HOLO_TABLE = [
    { id: 'none', name: 'None', threshold: 0.60, prob: 0.60 },
    { id: 'shiny', name: 'Shiny', threshold: 0.80, prob: 0.20 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.90, prob: 0.10 },
    { id: 'pearl', name: 'Pearlescent', threshold: 0.98, prob: 0.08 },
    { id: 'fractal', name: 'Fractal', threshold: 0.9955, prob: 0.0155 },
    { id: 'void', name: 'Void', threshold: 1.000, prob: 0.0045 }
];

// Character pools - 15 characters per pack
// Each character has a fixed rarity (not random!)
// bg = background ID, rarity = fixed rarity tier
const CHARACTER_POOLS = {
    waifu: [
        // Common (6)
        { id: 'w01', name: 'The Village Herbalist', bg: 'bg_garden', rarity: 'c' },
        { id: 'w02', name: 'The Novice Cleric', bg: 'bg_temple', rarity: 'c' },
        { id: 'w03', name: 'The Steel Vanguard', bg: 'bg_castle', rarity: 'c' },
        { id: 'w04', name: 'The Elven Scribe', bg: 'bg_forest', rarity: 'c' },
        { id: 'w05', name: 'The Dwarven Smith', bg: 'bg_forge', rarity: 'c' },
        { id: 'w06', name: 'The Nekomimi Baker', bg: 'bg_village', rarity: 'c' },
        // Rare (4)
        { id: 'w07', name: 'The Royal Duelist', bg: 'bg_castle', rarity: 'r' },
        { id: 'w08', name: 'The Forest Ranger', bg: 'bg_forest', rarity: 'r' },
        { id: 'w09', name: 'The Kitsune Diviner', bg: 'bg_shrine', rarity: 'r' },
        { id: 'w10', name: 'The Tavern Brawler', bg: 'bg_tavern', rarity: 'r' },
        // Super Rare (3)
        { id: 'w11', name: 'The Shadow Assassin', bg: 'bg_night', rarity: 'sr' },
        { id: 'w12', name: 'The Dancer of the Dunes', bg: 'bg_desert', rarity: 'sr' },
        { id: 'w13', name: 'The Barbarian Queen', bg: 'bg_mountain', rarity: 'sr' },
        // SSR (1)
        { id: 'w14', name: 'The Dragon Sorceress', bg: 'bg_volcano', rarity: 'ssr' },
        // UR (1)
        { id: 'w15', name: 'The Goddess of Love', bg: 'bg_celestial', rarity: 'ur' }
    ],
    husbando: [
        // Common (6)
        { id: 'h01', name: 'The City Watchman', bg: 'bg_city', rarity: 'c' },
        { id: 'h02', name: 'The Traveling Merchant', bg: 'bg_road', rarity: 'c' },
        { id: 'h03', name: 'The Court Mage', bg: 'bg_castle', rarity: 'c' },
        { id: 'h04', name: 'The Halfling Bard', bg: 'bg_tavern', rarity: 'c' },
        { id: 'h05', name: 'The Stable Master', bg: 'bg_village', rarity: 'c' },
        { id: 'h06', name: 'The Alchemist', bg: 'bg_laboratory', rarity: 'c' },
        // Rare (4)
        { id: 'h07', name: 'The Elven Ranger', bg: 'bg_forest', rarity: 'r' },
        { id: 'h08', name: 'The Pirate First Mate', bg: 'bg_ocean', rarity: 'r' },
        { id: 'h09', name: 'The Martial Monk', bg: 'bg_dojo', rarity: 'r' },
        { id: 'h10', name: 'The Wolf-Kin Warrior', bg: 'bg_snow', rarity: 'r' },
        // Super Rare (3)
        { id: 'h11', name: 'The Gladiator Champion', bg: 'bg_arena', rarity: 'sr' },
        { id: 'h12', name: 'The Orc Warlord', bg: 'bg_battlefield', rarity: 'sr' },
        { id: 'h13', name: 'The Dark Elf Warlock', bg: 'bg_ruins', rarity: 'sr' },
        // SSR (1)
        { id: 'h14', name: 'The Demon Lord', bg: 'bg_inferno', rarity: 'ssr' },
        // UR (1)
        { id: 'h15', name: 'The Sun God Avatar', bg: 'bg_celestial', rarity: 'ur' }
    ]
};

// ============================================
// RNG ENGINE (3-Axis Roller)
// ============================================

/**
 * Generic weighted roll function
 * @param {Array} table - Array of {id, name, threshold} objects
 * @returns {Object} The selected entry from the table
 */
function weightedRoll(table) {
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
function rollRarity() {
    return weightedRoll(RARITY_TABLE);
}

/**
 * Roll for frame style
 * @returns {Object} Frame data
 */
function rollFrame() {
    return weightedRoll(FRAME_TABLE);
}

/**
 * Roll for holographic effect
 * @returns {Object} Holo data
 */
function rollHolo() {
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
 * @param {string} packType - 'waifu' or 'husbando'
 * @returns {Object} Complete card data
 */
function generateCard(packType) {
    // Roll for rarity tier first
    const rarityRoll = rollRarity();
    const frame = rollFrame();
    const holo = rollHolo();

    // Get all characters of this rarity from the pool
    const pool = CHARACTER_POOLS[packType];
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
        backgroundPath: `assets/backgrounds/${character.bg}.webp`,
        characterPath: `assets/${packType}/${character.id}.webp`,
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for Frame Testing
 * All Kitsune Diviner ('w09'), specified frame, no holo
 */
function generateFrameDebugCard(frameId) {
    const character = CHARACTER_POOLS.waifu.find(c => c.id === 'w09');
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
        combinedProb: 0, // Debug
        backgroundPath: `assets/backgrounds/${character.bg}.webp`,
        characterPath: `assets/waifu/${character.id}.webp`,
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for Holo Testing
 * All Kitsune Diviner ('w09'), white frame, specified holo
 */
function generateHoloDebugCard(holoId) {
    const character = CHARACTER_POOLS.waifu.find(c => c.id === 'w09');
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
        combinedProb: 0, // Debug
        backgroundPath: `assets/backgrounds/${character.bg}.webp`,
        characterPath: `assets/waifu/${character.id}.webp`,
        obtainedAt: Date.now()
    };
}

/**
 * Generate a DEBUG card for God Pack
 * Guaranteed UR/SSR tier with rainbow/black frames and rare holos
 */
function generateDebugCard() {
    // Alternate between the two UR characters
    const urCharacters = [
        CHARACTER_POOLS.waifu.find(c => c.id === 'w15'), // Goddess of Love
        CHARACTER_POOLS.husbando.find(c => c.id === 'h15'), // Sun God Avatar
        CHARACTER_POOLS.waifu.find(c => c.id === 'w14'), // Dragon Sorceress
        CHARACTER_POOLS.husbando.find(c => c.id === 'h14'), // Demon Lord
    ];
    const character = urCharacters[Math.floor(Math.random() * urCharacters.length)];
    const rarity = RARITY_TABLE.find(r => r.id === character.rarity);

    // God pack: rare frames only (gold, rainbow, black)
    const rareFrames = ['gold', 'rainbow', 'black'];
    const frameId = rareFrames[Math.floor(Math.random() * rareFrames.length)];
    const frame = FRAME_TABLE.find(f => f.id === frameId);

    // God pack: rare holos only (pearl, fractal, void)
    const rareHolos = ['pearl', 'fractal', 'void'];
    const holoId = rareHolos[Math.floor(Math.random() * rareHolos.length)];
    const holo = HOLO_TABLE.find(h => h.id === holoId);

    const packType = character.id.startsWith('w') ? 'waifu' : 'husbando';

    return {
        id: generateCardId(),
        characterId: character.id,
        name: character.name,
        packType: packType,
        rarity: rarity,
        frame: frame,
        holo: holo,
        combinedProb: 0, // Debug
        backgroundPath: `assets/backgrounds/${character.bg}.webp`,
        characterPath: `assets/${packType}/${character.id}.webp`,
        obtainedAt: Date.now()
    };
}

/**
 * Open a pack and generate cards
 * @param {string} packType - 'waifu', 'husbando', 'debug', 'debug-frame', 'debug-holo'
 * @returns {Array} Array of generated cards
 */
function openPack(packType) {
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
