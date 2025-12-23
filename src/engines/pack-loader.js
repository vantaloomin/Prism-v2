/**
 * AETHAL SAGA - Pack Loader Module
 * Dynamic pack discovery and loading system
 * 
 * This module handles:
 * - Loading pack index and manifests at startup
 * - Building character pools dynamically
 * - Resolving asset paths for pack-specific resources
 * - Loading lore data on demand
 */

// ============================================
// STATE
// ============================================

/** @type {Map<string, Object>} Loaded pack manifests keyed by pack ID */
const loadedPacks = new Map();

/** @type {Map<string, Object>} Loaded lore data keyed by pack ID */
const loreCache = new Map();

/** @type {boolean} Whether packs have been loaded */
let isInitialized = false;

// ============================================
// PACK LOADING
// ============================================

/**
 * Load all packs from the packs directory
 * Should be called once at application startup
 * @returns {Promise<void>}
 */
export async function loadAllPacks() {
    if (isInitialized) {
        console.warn('Pack loader already initialized');
        return;
    }

    try {
        // Load pack index
        const indexResponse = await fetch(`${import.meta.env.BASE_URL}packs/index.json`);
        if (!indexResponse.ok) {
            throw new Error(`Failed to load pack index: ${indexResponse.status}`);
        }
        const index = await indexResponse.json();

        // Load each pack manifest
        const loadPromises = index.packs.map(packId => loadPack(packId));
        await Promise.all(loadPromises);

        isInitialized = true;
        console.log(`✦ Pack Loader: Loaded ${loadedPacks.size} packs ✦`);
    } catch (error) {
        console.error('Failed to load packs:', error);
        throw error;
    }
}

/**
 * Load a single pack manifest
 * @param {string} packId - Pack identifier (folder name)
 * @returns {Promise<Object>} The loaded pack data
 */
async function loadPack(packId) {
    try {
        const response = await fetch(`${import.meta.env.BASE_URL}packs/${packId}/pack.json`);
        if (!response.ok) {
            throw new Error(`Failed to load pack ${packId}: ${response.status}`);
        }
        const packData = await response.json();

        // Store pack data
        loadedPacks.set(packId, packData);
        console.log(`  ✓ Loaded pack: ${packData.name} (${packData.characters.length} characters)`);

        return packData;
    } catch (error) {
        console.error(`Failed to load pack ${packId}:`, error);
        throw error;
    }
}

// ============================================
// PACK ACCESS
// ============================================

/**
 * Get a pack by ID
 * @param {string} packId - Pack identifier
 * @returns {Object|null} Pack data or null if not found
 */
export function getPackById(packId) {
    return loadedPacks.get(packId) || null;
}

/**
 * Get all enabled packs, sorted by order
 * @returns {Array<Object>} Array of enabled pack data
 */
export function getAllEnabledPacks() {
    return Array.from(loadedPacks.values())
        .filter(pack => pack.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Get all pack IDs
 * @returns {Array<string>} Array of pack IDs
 */
export function getAllPackIds() {
    return Array.from(loadedPacks.keys());
}

/**
 * Check if packs have been loaded
 * @returns {boolean}
 */
export function isPacksLoaded() {
    return isInitialized;
}

// ============================================
// CHARACTER POOL BUILDING
// ============================================

/**
 * Build CHARACTER_POOLS object for use by pack-logic.js
 * This transforms the loaded pack data into the format expected by generateCard()
 * @returns {Object} Character pools keyed by pack ID
 */
export function buildCharacterPools() {
    const pools = {};

    for (const [packId, packData] of loadedPacks) {
        pools[packId] = packData.characters.map(char => ({
            id: char.id,
            name: char.name,
            bg: char.background,
            rarity: char.rarity
        }));
    }

    return pools;
}

// ============================================
// ASSET PATH RESOLUTION
// ============================================

/**
 * Get the path to a character image
 * @param {string} packId - Pack identifier
 * @param {string} characterId - Character identifier
 * @returns {string} Full path to character image
 */
export function getCharacterPath(packId, characterId) {
    return `${import.meta.env.BASE_URL}packs/${packId}/characters/${characterId}.webp`;
}

/**
 * Get the path to a background image
 * @param {string} packId - Pack identifier  
 * @param {string} backgroundId - Background identifier (e.g., 'bg_forest')
 * @returns {string} Full path to background image
 */
export function getBackgroundPath(packId, backgroundId) {
    return `${import.meta.env.BASE_URL}packs/${packId}/backgrounds/${backgroundId}.webp`;
}

/**
 * Get the path to a pack's icon
 * @param {string} packId - Pack identifier
 * @returns {string} Full path to pack icon
 */
export function getPackIconPath(packId) {
    return `${import.meta.env.BASE_URL}packs/${packId}/pack_icon.webp`;
}

// ============================================
// LORE DATA
// ============================================

/**
 * Load lore data for a pack (cached)
 * @param {string} packId - Pack identifier
 * @returns {Promise<Object|null>} Lore data object or null if not available
 */
export async function loadPackLore(packId) {
    // Check cache first
    if (loreCache.has(packId)) {
        return loreCache.get(packId);
    }

    try {
        const response = await fetch(`${import.meta.env.BASE_URL}packs/${packId}/lore.json`);
        if (!response.ok) {
            // Lore is optional - don't throw error
            console.log(`  ℹ No lore found for pack: ${packId}`);
            loreCache.set(packId, null);
            return null;
        }
        const loreData = await response.json();
        loreCache.set(packId, loreData);
        return loreData;
    } catch (error) {
        console.warn(`Could not load lore for pack ${packId}:`, error);
        loreCache.set(packId, null);
        return null;
    }
}

/**
 * Get lore for a specific character
 * @param {string} packId - Pack identifier
 * @param {string} characterId - Character identifier
 * @returns {Promise<Object|null>} Character lore or null if not available
 */
export async function getCharacterLore(packId, characterId) {
    const lore = await loadPackLore(packId);
    if (!lore) return null;
    return lore[characterId] || null;
}

// ============================================
// DEBUG UTILITIES
// ============================================

/**
 * Get debug info about loaded packs
 * @returns {Object} Debug information
 */
export function getPackDebugInfo() {
    return {
        initialized: isInitialized,
        packCount: loadedPacks.size,
        packs: Array.from(loadedPacks.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            enabled: data.enabled,
            characterCount: data.characters.length
        }))
    };
}
