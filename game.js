/* ============================================
   PROJECT PRISM - GAME ENGINE
   ============================================ */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const CONFIG = {
    PACK_COST: 100,
    PACK_SIZE: 5,
    STARTING_CREDITS: 1000,
    STORAGE_KEY: 'prism_save_data'
};

// Probability tables from PRD (values are cumulative thresholds)
const RARITY_TABLE = [
    { id: 'c', name: 'Common', threshold: 0.50, color: '#9ca3af' },
    { id: 'r', name: 'Rare', threshold: 0.80, color: '#3b82f6' },
    { id: 'sr', name: 'Super Rare', threshold: 0.94, color: '#a855f7' },
    { id: 'ssr', name: 'Super Special Rare', threshold: 0.99, color: '#f59e0b' },
    { id: 'ur', name: 'Ultra Rare', threshold: 1.00, color: '#ef4444' }
];

const FRAME_TABLE = [
    { id: 'white', name: 'White', threshold: 0.500 },
    { id: 'blue', name: 'Blue', threshold: 0.800 },
    { id: 'red', name: 'Red', threshold: 0.950 },
    { id: 'gold', name: 'Gold', threshold: 0.9855 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.9955 },
    { id: 'black', name: 'Black', threshold: 1.000 }
];

const HOLO_TABLE = [
    { id: 'none', name: 'None', threshold: 0.60 },
    { id: 'shiny', name: 'Shiny', threshold: 0.80 },
    { id: 'rainbow', name: 'Rainbow', threshold: 0.90 },
    { id: 'pearl', name: 'Pearlescent', threshold: 0.98 },
    { id: 'fractal', name: 'Fractal', threshold: 0.9955 },
    { id: 'void', name: 'Void', threshold: 1.000 }
];

// Character pools - will be populated with actual assets later
const CHARACTER_POOLS = {
    waifu: [
        { id: 'w01', name: 'Sakura' },
        { id: 'w02', name: 'Luna' },
        { id: 'w03', name: 'Aria' },
        { id: 'w04', name: 'Yuki' },
        { id: 'w05', name: 'Hana' },
        { id: 'w06', name: 'Miku' },
        { id: 'w07', name: 'Rei' },
        { id: 'w08', name: 'Nana' },
        { id: 'w09', name: 'Sora' },
        { id: 'w10', name: 'Kira' }
    ],
    husbando: [
        { id: 'h01', name: 'Kaito' },
        { id: 'h02', name: 'Ryu' },
        { id: 'h03', name: 'Zen' },
        { id: 'h04', name: 'Akira' },
        { id: 'h05', name: 'Hiro' },
        { id: 'h06', name: 'Dante' },
        { id: 'h07', name: 'Leon' },
        { id: 'h08', name: 'Kai' },
        { id: 'h09', name: 'Shin' },
        { id: 'h10', name: 'Nova' }
    ]
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
    credits: CONFIG.STARTING_CREDITS,
    inventory: [],
    stats: {
        packsOpened: 0,
        totalCards: 0
    }
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
 * Generate a single card with all three axes rolled
 * @param {string} packType - 'waifu' or 'husbando'
 * @returns {Object} Complete card data
 */
function generateCard(packType) {
    const rarity = rollRarity();
    const frame = rollFrame();
    const holo = rollHolo();
    const pool = CHARACTER_POOLS[packType];
    const character = pool[Math.floor(Math.random() * pool.length)];
    
    return {
        id: generateCardId(),
        characterId: character.id,
        name: character.name,
        packType: packType,
        rarity: rarity,
        frame: frame,
        holo: holo,
        imagePath: `assets/${packType}/${character.id}.webp`,
        obtainedAt: Date.now()
    };
}

/**
 * Open a pack and generate cards
 * @param {string} packType - 'waifu' or 'husbando'
 * @returns {Array} Array of generated cards
 */
function openPack(packType) {
    const cards = [];
    for (let i = 0; i < CONFIG.PACK_SIZE; i++) {
        cards.push(generateCard(packType));
    }
    return cards;
}

// ============================================
// DOM RENDERING
// ============================================

/**
 * Create a card DOM element from card data
 * @param {Object} cardData - The card data object
 * @param {boolean} faceDown - Whether to show face down initially
 * @returns {HTMLElement} The card element
 */
function createCardElement(cardData, faceDown = true) {
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
                <!-- Z-1: Background -->
                <div class="card-layer-bg" style="background: linear-gradient(135deg, #1a1a2e, #2d2d44);"></div>
                
                <!-- Z-2: Character Art -->
                <div class="card-layer-character">
                    <img src="${cardData.imagePath}" alt="${cardData.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 140%22><rect fill=%22%23333%22 width=%22100%22 height=%22140%22/><text x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>${cardData.name}</text></svg>'">
                </div>
                
                <!-- Z-3: Frame -->
                <div class="card-layer-frame"></div>
                
                <!-- Z-4: Holo Overlay -->
                <div class="card-layer-holo"></div>
                
                <!-- Z-5: Stats/UI -->
                <div class="card-layer-stats">
                    <span class="card-rarity">${cardData.rarity.id.toUpperCase()}</span>
                    <span class="card-name">${cardData.name}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add flip interaction
    card.addEventListener('click', () => {
        if (!card.classList.contains('is-flipped')) {
            card.classList.add('is-flipped');
            // Check for special reveals
            if (cardData.rarity.id === 'ur' || cardData.holo.id === 'void') {
                triggerSpecialReveal(card, cardData);
            }
        }
    });
    
    return card;
}

/**
 * Trigger special effects for rare cards
 * @param {HTMLElement} cardElement - The card DOM element
 * @param {Object} cardData - The card data
 */
function triggerSpecialReveal(cardElement, cardData) {
    // Add screen shake for UR
    if (cardData.rarity.id === 'ur') {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
    
    // Could add confetti, sound effects, etc. here
    console.log('🎉 Special reveal:', cardData.rarity.name, cardData.frame.name, cardData.holo.name);
}

/**
 * Render the card display area with new cards
 * @param {Array} cards - Array of card data objects
 */
function renderCardDisplay(cards) {
    const displayArea = document.getElementById('card-display-area');
    displayArea.innerHTML = '';
    
    cards.forEach((cardData, index) => {
        const cardElement = createCardElement(cardData, true);
        cardElement.classList.add('dealing');
        cardElement.style.animationDelay = `${index * 0.15}s`;
        displayArea.appendChild(cardElement);
    });
}

/**
 * Render the gallery grid
 */
function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const countElement = document.getElementById('collection-count');
    
    countElement.textContent = gameState.inventory.length;
    
    if (gameState.inventory.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-empty" style="grid-column: 1 / -1;">
                <div class="gallery-empty-icon">📦</div>
                <p>No cards yet. Open a pack to start your collection!</p>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    // Show newest first
    const sortedInventory = [...gameState.inventory].reverse();
    
    sortedInventory.forEach(cardData => {
        const cardElement = createCardElement(cardData, false);
        galleryGrid.appendChild(cardElement);
    });
}

/**
 * Update the credits display
 */
function updateCreditsDisplay() {
    document.getElementById('credits-amount').textContent = gameState.credits;
    
    // Disable buttons if not enough credits
    const waifuBtn = document.getElementById('btn-waifu-pack');
    const husbandoBtn = document.getElementById('btn-husbando-pack');
    
    waifuBtn.disabled = gameState.credits < CONFIG.PACK_COST;
    husbandoBtn.disabled = gameState.credits < CONFIG.PACK_COST;
}

// ============================================
// PACK OPENING SEQUENCE
// ============================================

/**
 * Handle pack purchase and opening
 * @param {string} packType - 'waifu' or 'husbando'
 */
async function handlePackPurchase(packType) {
    if (gameState.credits < CONFIG.PACK_COST) {
        console.log('Not enough credits!');
        return;
    }
    
    // Deduct credits
    gameState.credits -= CONFIG.PACK_COST;
    updateCreditsDisplay();
    
    // Hide shop, show pack animation
    const packShop = document.getElementById('pack-shop');
    const packContainer = document.getElementById('pack-animation-container');
    const packImage = document.getElementById('pack-image');
    
    packShop.hidden = true;
    packContainer.hidden = false;
    packImage.textContent = packType === 'waifu' ? '🌸' : '⚔️';
    
    // Generate cards (but don't show yet)
    const cards = openPack(packType);
    
    // Log for debugging
    console.log('Pack opened:', cards.map(c => 
        `${c.name} [${c.rarity.id.toUpperCase()}/${c.frame.id}/${c.holo.id}]`
    ));
    
    // Pack shake animation on click
    packImage.onclick = async () => {
        packImage.classList.add('shaking');
        
        await sleep(600);
        
        // Hide pack, show cards
        packContainer.hidden = true;
        renderCardDisplay(cards);
        
        // Add cards to inventory
        gameState.inventory.push(...cards);
        gameState.stats.packsOpened++;
        gameState.stats.totalCards += cards.length;
        
        // Save and update gallery
        saveGame();
        renderGallery();
    };
}

/**
 * Show the pack shop again
 */
function showPackShop() {
    const packShop = document.getElementById('pack-shop');
    const displayArea = document.getElementById('card-display-area');
    
    displayArea.innerHTML = '';
    packShop.hidden = false;
}

// ============================================
// PERSISTENCE (localStorage)
// ============================================

/**
 * Save game state to localStorage
 */
function saveGame() {
    const saveData = {
        credits: gameState.credits,
        inventory: gameState.inventory,
        stats: gameState.stats,
        savedAt: Date.now()
    };
    
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(saveData));
        console.log('Game saved!', saveData.stats);
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

/**
 * Load game state from localStorage
 */
function loadGame() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const saveData = JSON.parse(saved);
            gameState.credits = saveData.credits ?? CONFIG.STARTING_CREDITS;
            gameState.inventory = saveData.inventory ?? [];
            gameState.stats = saveData.stats ?? { packsOpened: 0, totalCards: 0 };
            console.log('Game loaded!', gameState.stats);
            return true;
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
    return false;
}

/**
 * Reset all save data
 */
function resetSave() {
    if (confirm('Are you sure you want to delete all your progress? This cannot be undone!')) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        gameState = {
            credits: CONFIG.STARTING_CREDITS,
            inventory: [],
            stats: { packsOpened: 0, totalCards: 0 }
        };
        updateCreditsDisplay();
        renderGallery();
        showPackShop();
        console.log('Save data reset!');
    }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Sleep utility for animations
 * @param {number} ms - Milliseconds to wait
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test RNG distribution (debug utility)
 * @param {number} iterations - Number of packs to simulate
 */
function testRngDistribution(iterations = 1000) {
    const results = {
        rarity: {},
        frame: {},
        holo: {}
    };
    
    for (let i = 0; i < iterations * CONFIG.PACK_SIZE; i++) {
        const r = rollRarity();
        const f = rollFrame();
        const h = rollHolo();
        
        results.rarity[r.id] = (results.rarity[r.id] || 0) + 1;
        results.frame[f.id] = (results.frame[f.id] || 0) + 1;
        results.holo[h.id] = (results.holo[h.id] || 0) + 1;
    }
    
    const total = iterations * CONFIG.PACK_SIZE;
    console.log('=== RNG Distribution Test ===');
    console.log(`Sample size: ${total} cards (${iterations} packs)`);
    console.log('\nRarity:');
    for (const [key, count] of Object.entries(results.rarity)) {
        console.log(`  ${key}: ${count} (${(count/total*100).toFixed(2)}%)`);
    }
    console.log('\nFrame:');
    for (const [key, count] of Object.entries(results.frame)) {
        console.log(`  ${key}: ${count} (${(count/total*100).toFixed(2)}%)`);
    }
    console.log('\nHolo:');
    for (const [key, count] of Object.entries(results.holo)) {
        console.log(`  ${key}: ${count} (${(count/total*100).toFixed(2)}%)`);
    }
    
    // Check for God Roll
    let godRolls = 0;
    for (let i = 0; i < iterations * CONFIG.PACK_SIZE; i++) {
        const r = rollRarity();
        const f = rollFrame();
        const h = rollHolo();
        if (r.id === 'ur' && f.id === 'black' && h.id === 'void') {
            godRolls++;
        }
    }
    console.log(`\nGod Rolls (UR/Black/Void): ${godRolls} in ${total} cards`);
    console.log(`Expected: ~${(total * 0.01 * 0.0045 * 0.0045).toFixed(4)}`);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Load saved data
    loadGame();
    
    // Update UI
    updateCreditsDisplay();
    renderGallery();
    
    // Bind event listeners
    document.getElementById('btn-waifu-pack').addEventListener('click', () => {
        handlePackPurchase('waifu');
    });
    
    document.getElementById('btn-husbando-pack').addEventListener('click', () => {
        handlePackPurchase('husbando');
    });
    
    document.getElementById('btn-reset').addEventListener('click', resetSave);
    
    // Add click handler for card display area to go back to shop
    document.getElementById('card-display-area').addEventListener('click', (e) => {
        // Only show shop if clicking empty area (not a card)
        if (e.target === e.currentTarget) {
            showPackShop();
        }
    });
    
    console.log('✦ Project Prism initialized! ✦');
    console.log('Debug: Run testRngDistribution(1000) to test RNG');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
