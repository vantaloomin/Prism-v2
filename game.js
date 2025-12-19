
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
                        ${cardData.name}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add flip interaction (or focus mode if already flipped)
    card.addEventListener('click', (e) => {
        // Don't trigger if we're in focus mode
        if (document.getElementById('card-focus-overlay').hidden === false) {
            return;
        }

        if (!card.classList.contains('is-flipped')) {
            // Card is face-down, flip it
            card.classList.add('is-flipped');
            // Check for special reveals
            if (cardData.rarity.id === 'ur' || cardData.holo.id === 'void') {
                triggerSpecialReveal(card, cardData);
            }
        } else {
            // Card is already face-up, open focus mode
            openFocusMode(cardData);
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

    // Create card container
    const cardRow = document.createElement('div');
    cardRow.className = 'card-row';
    cardRow.style.cssText = 'display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;';

    cards.forEach((cardData, index) => {
        const cardElement = createCardElement(cardData, true);
        cardElement.classList.add('dealing');
        cardElement.style.animationDelay = `${index * 0.15}s`;
        cardRow.appendChild(cardElement);
    });

    displayArea.appendChild(cardRow);

    // Add continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-button';
    continueBtn.textContent = '✦ Continue ✦';
    continueBtn.onclick = showPackShop;
    displayArea.appendChild(continueBtn);
}

/**
 * Get sort order value for rarity (Common first → UR last, like a binder)
 */
function getRaritySortOrder(rarityId) {
    const order = { 'c': 0, 'r': 1, 'sr': 2, 'ssr': 3, 'ur': 4 };
    return order[rarityId] ?? -1;
}

/**
 * Get sort order value for frame (White first → Black last)
 */
function getFrameSortOrder(frameId) {
    const order = { 'white': 0, 'blue': 1, 'red': 2, 'gold': 3, 'rainbow': 4, 'black': 5 };
    return order[frameId] ?? -1;
}

/**
 * Get sort order value for holo (None first → Void last)
 */
function getHoloSortOrder(holoId) {
    const order = { 'none': 0, 'shiny': 1, 'rainbow': 2, 'pearl': 3, 'fractal': 4, 'void': 5 };
    return order[holoId] ?? -1;
}

/**
 * Generate a unique key for grouping duplicate cards
 */
function getCardGroupKey(card) {
    return `${card.characterId}_${card.frame.id}_${card.holo.id}`;
}

/**
 * Render the collection view with sorted, grouped cards
 */
function renderCollection(page = null) {
    const container = document.getElementById('collection-container');
    const uniqueCount = document.getElementById('unique-count');
    const totalCount = document.getElementById('total-count');
    const badge = document.getElementById('collection-badge');

    // Cards per page (5 columns × 4 rows = 20)
    const CARDS_PER_PAGE = 20;

    // Update counts
    totalCount.textContent = gameState.inventory.length;
    badge.textContent = gameState.inventory.length;

    if (gameState.inventory.length === 0) {
        container.innerHTML = `
            <div class="binder-grid">
                <div class="gallery-empty" style="grid-column: 1 / -1;">
                    <div class="gallery-empty-icon">📦</div>
                    <p>No cards yet. Open a pack to start your collection!</p>
                </div>
            </div>
        `;
        uniqueCount.textContent = '0';
        return;
    }

    // Group cards by unique combo (character + frame + holo)
    const cardGroups = {};
    gameState.inventory.forEach(card => {
        const key = getCardGroupKey(card);
        if (!cardGroups[key]) {
            cardGroups[key] = {
                card: card,
                count: 0
            };
        }
        cardGroups[key].count++;
    });

    // Convert to array and sort (Common → UR, White → Black, None → Void)
    const sortedGroups = Object.values(cardGroups);
    sortedGroups.sort((a, b) => {
        // Sort by rarity
        const rarityDiff = getRaritySortOrder(a.card.rarity.id) - getRaritySortOrder(b.card.rarity.id);
        if (rarityDiff !== 0) return rarityDiff;

        // Then by frame
        const frameDiff = getFrameSortOrder(a.card.frame.id) - getFrameSortOrder(b.card.frame.id);
        if (frameDiff !== 0) return frameDiff;

        // Then by holo
        const holoDiff = getHoloSortOrder(a.card.holo.id) - getHoloSortOrder(b.card.holo.id);
        if (holoDiff !== 0) return holoDiff;

        // Finally by name
        return a.card.name.localeCompare(b.card.name);
    });

    uniqueCount.textContent = sortedGroups.length;

    // Pagination
    const totalPages = Math.ceil(sortedGroups.length / CARDS_PER_PAGE);
    const currentPage = page !== null ? page : (collectionState.currentPage || 1);
    collectionState.currentPage = Math.max(1, Math.min(currentPage, totalPages));

    const startIdx = (collectionState.currentPage - 1) * CARDS_PER_PAGE;
    const endIdx = Math.min(startIdx + CARDS_PER_PAGE, sortedGroups.length);
    const pageGroups = sortedGroups.slice(startIdx, endIdx);

    // Render binder grid
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'binder-grid';

    pageGroups.forEach(group => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collection-card-wrapper';

        // Add stack classes for duplicate visual effect
        if (group.count === 2) {
            wrapper.classList.add('has-duplicates', 'stack-2');
        } else if (group.count >= 3) {
            wrapper.classList.add('has-duplicates', 'stack-3');
        }

        const cardElement = createCardElement(group.card, false);
        wrapper.appendChild(cardElement);

        // Store card data reference for shader initialization
        cardElement._cardData = group.card;

        // Add count badge if duplicates
        if (group.count > 1) {
            const countBadge = document.createElement('span');
            countBadge.className = 'card-count-badge';
            countBadge.textContent = `×${group.count}`;
            wrapper.appendChild(countBadge);
        }

        grid.appendChild(wrapper);
    });

    // Render pagination controls if more than one page (at top)
    if (totalPages > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination-controls';
        pagination.innerHTML = `
            <button class="pagination-btn" id="page-prev" ${collectionState.currentPage <= 1 ? 'disabled' : ''}>◀</button>
            <div class="pagination-info">
                <span class="pagination-page">Page ${collectionState.currentPage} of ${totalPages}</span>
                <span class="pagination-range">${startIdx + 1}-${endIdx} of ${sortedGroups.length}</span>
            </div>
            <button class="pagination-btn" id="page-next" ${collectionState.currentPage >= totalPages ? 'disabled' : ''}>▶</button>
        `;
        container.appendChild(pagination);

        // Bind pagination handlers
        document.getElementById('page-prev').addEventListener('click', () => {
            renderCollection(collectionState.currentPage - 1);
        });
        document.getElementById('page-next').addEventListener('click', () => {
            renderCollection(collectionState.currentPage + 1);
        });
    }

    container.appendChild(grid);

    // Initialize shaders for all visible cards after DOM is ready
    requestAnimationFrame(() => {
        initShadersForVisibleCards();
    });
}

// Collection state for pagination
const collectionState = {
    currentPage: 1
};

/**
 * Update the credits display
 */
function updateCreditsDisplay() {
    document.getElementById('credits-amount').textContent = gameState.credits;

    // Disable buttons if not enough credits
    const waifuBtn = document.getElementById('btn-waifu-pack');
    const husbandoBtn = document.getElementById('btn-husbando-pack');
    const debugBtn = document.getElementById('btn-debug-pack');
    const frameDebugBtn = document.getElementById('btn-debug-frame-pack');
    const holoDebugBtn = document.getElementById('btn-debug-holo-pack');

    if (waifuBtn) waifuBtn.disabled = gameState.credits < CONFIG.PACK_COST;
    if (husbandoBtn) husbandoBtn.disabled = gameState.credits < CONFIG.PACK_COST;
    if (debugBtn) debugBtn.disabled = gameState.credits < CONFIG.PACK_COST;
    if (frameDebugBtn) frameDebugBtn.disabled = gameState.credits < CONFIG.FRAME_DEBUG_COST;
    if (holoDebugBtn) holoDebugBtn.disabled = gameState.credits < CONFIG.HOLO_DEBUG_COST;
}

// ============================================
// PACK OPENING SEQUENCE
// ============================================

/**
 * Handle pack purchase and opening
 * @param {string} packType - 'waifu' or 'husbando'
 */
async function handlePackPurchase(packType) {
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
            renderCardDisplayAnimated(cards);

            // Add cards to inventory
            gameState.inventory.push(...cards);
            gameState.stats.packsOpened++;
            gameState.stats.totalCards += cards.length;

            // Save and update collection
            saveGame();
            renderCollection();
        });
    };
}

/**
 * Render card display with GSAP dealing animation
 * @param {Array} cards - Card data array
 */
function renderCardDisplayAnimated(cards) {
    const displayArea = document.getElementById('card-display-area');
    displayArea.innerHTML = '';

    // Create card row container for horizontal layout
    const cardRow = document.createElement('div');
    cardRow.className = 'card-row';
    cardRow.style.cssText = 'display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;';
    displayArea.appendChild(cardRow);

    // Create card elements inside the row
    const cardElements = cards.map((cardData, index) => {
        const cardElement = createCardElement(cardData, true); // Face down
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
                    if (typeof initShaderCanvas === 'function') {
                        initShaderCanvas(element, data);
                    }

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
function showPackShop() {
    // Clean up any active shaders before leaving
    if (typeof destroyShaderCanvas === 'function') {
        destroyShaderCanvas();
    }

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
        console.log('Save data reset!');
        // Force full page refresh to reinitialize all state
        location.reload();
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
 * Calculate the combined odds of a card's rarity/frame/holo combo
 * @param {Object} cardData - The card data object
 * @returns {string} Formatted odds string like "1 : 5,000,000"
 */
function calculateOddsString(cardData) {
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
        console.log(`  ${key}: ${count} (${(count / total * 100).toFixed(2)}%)`);
    }
    console.log('\nFrame:');
    for (const [key, count] of Object.entries(results.frame)) {
        console.log(`  ${key}: ${count} (${(count / total * 100).toFixed(2)}%)`);
    }
    console.log('\nHolo:');
    for (const [key, count] of Object.entries(results.holo)) {
        console.log(`  ${key}: ${count} (${(count / total * 100).toFixed(2)}%)`);
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

/**
 * Show the landing page
 */
function showLandingPage() {
    const landingPage = document.getElementById('landing-page');
    const homeBtn = document.getElementById('btn-home');

    if (landingPage) {
        landingPage.classList.remove('hidden');
    }
    if (homeBtn) {
        homeBtn.classList.add('hidden');
    }

    // Update landing page credits display
    const landingCredits = document.getElementById('landing-credits-amount');
    if (landingCredits) {
        landingCredits.textContent = gameState.credits;
    }
}

/**
 * Hide the landing page and show the main app
 */
function hideLandingPage() {
    const landingPage = document.getElementById('landing-page');
    const homeBtn = document.getElementById('btn-home');

    if (landingPage) {
        landingPage.classList.add('hidden');
    }
    if (homeBtn) {
        homeBtn.classList.remove('hidden');
    }
}

/**
 * Navigate from landing page to a specific tab
 * @param {string} tabId - 'shop', 'games', or 'collection'
 */
function navigateFromLanding(tabId) {
    hideLandingPage();
    switchTab(tabId);
}

function init() {
    // Load saved data
    loadGame();

    // Update UI
    updateCreditsDisplay();
    renderCollection();

    // Update landing page credits
    const landingCredits = document.getElementById('landing-credits-amount');
    if (landingCredits) {
        landingCredits.textContent = gameState.credits;
    }

    // Landing page menu card clicks
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const menuTarget = card.dataset.menu;
            navigateFromLanding(menuTarget);
        });
    });

    // Home button to return to landing
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
        homeBtn.addEventListener('click', showLandingPage);
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Bind event listeners
    document.getElementById('btn-waifu-pack').addEventListener('click', () => {
        handlePackPurchase('waifu');
    });

    document.getElementById('btn-husbando-pack').addEventListener('click', () => {
        handlePackPurchase('husbando');
    });

    document.getElementById('btn-debug-pack').addEventListener('click', () => {
        handlePackPurchase('debug');
    });

    document.getElementById('btn-debug-frame-pack').addEventListener('click', () => {
        handlePackPurchase('debug-frame');
    });

    document.getElementById('btn-debug-holo-pack').addEventListener('click', () => {
        handlePackPurchase('debug-holo');
    });

    document.getElementById('btn-reset').addEventListener('click', resetSave);

    // Add click handler for card display area to go back to shop
    document.getElementById('card-display-area').addEventListener('click', (e) => {
        // Only show shop if clicking empty area (not a card)
        if (e.target === e.currentTarget) {
            showPackShop();
        }
    });

    // Card focus overlay close button
    document.getElementById('focus-close-btn').addEventListener('click', closeFocusMode);
    document.getElementById('card-focus-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('focus-backdrop')) {
            closeFocusMode();
        }
    });

    // Escape key to close focus mode or return to landing
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const landingPage = document.getElementById('landing-page');
            if (landingPage && !landingPage.classList.contains('hidden')) {
                // Already on landing, do nothing
                return;
            }

            const focusOverlay = document.getElementById('card-focus-overlay');
            if (focusOverlay && !focusOverlay.hidden) {
                closeFocusMode();
            } else {
                showLandingPage();
            }
        }
    });

    // Animation toggle
    const animToggle = document.getElementById('toggle-animations');
    if (animToggle) {
        animToggle.addEventListener('change', (e) => {
            if (typeof setAnimationsEnabled === 'function') {
                setAnimationsEnabled(e.target.checked);
            }
        });
    }

    console.log('✦ Project Prism initialized! ✦');
    console.log('Debug: Run testRngDistribution(1000) to test RNG');
}

/**
 * Switch between tabs
 * @param {string} tabId - 'shop', 'games', or 'collection'
 */
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-content-${tabId}`);
    });

    // Tab-specific actions
    if (tabId === 'collection') {
        renderCollection();
    } else if (tabId === 'games') {
        // Initialize games module when switching to games tab
        if (typeof initGames === 'function') {
            initGames();
        }
        // Clean up shaders when leaving collection
        if (typeof destroyShaderCanvas === 'function') {
            destroyShaderCanvas();
        }
    } else {
        // Clean up shaders when leaving collection
        if (typeof destroyShaderCanvas === 'function') {
            destroyShaderCanvas();
        }
    }
}

/**
 * Initialize shaders for all visible cards in the collection
 */
function initShadersForVisibleCards() {
    if (typeof initShaderCanvas !== 'function') return;

    const cards = document.querySelectorAll('.binder-grid .card');
    cards.forEach(cardElement => {
        if (cardElement._cardData) {
            initShaderCanvas(cardElement, cardElement._cardData);
        }
    });
}

// ============================================
// CARD FOCUS MODE
// ============================================

let focusedCardData = null;
let loreCache = null;

/**
 * Load lore data from JSON file
 * @param {string} characterId - Character ID (e.g., 'w01', 'h15')
 * @returns {Object|null} Lore data for the character
 */
async function loadLoreData(characterId) {
    // Load cache if not loaded
    if (!loreCache) {
        try {
            const response = await fetch('assets/lore/characters.json');
            loreCache = await response.json();
        } catch (error) {
            console.warn('Could not load lore data:', error);
            loreCache = {};
        }
    }

    return loreCache[characterId] || null;
}

/**
 * Open card focus mode to inspect a card
 * @param {Object} cardData - The card data to display
 */
async function openFocusMode(cardData) {
    focusedCardData = cardData;

    const overlay = document.getElementById('card-focus-overlay');
    const cardWrapper = document.getElementById('focus-card-wrapper');
    const infoPanel = document.getElementById('focus-info');

    // Create the focused card element
    const focusedCard = createCardElement(cardData, false);
    focusedCard.classList.add('is-flipped'); // Always show front

    // Clear and add card
    cardWrapper.innerHTML = '';
    cardWrapper.appendChild(focusedCard);

    // Initialize WebGL shader overlay for high-quality effects (with mouse tracking in Focus)
    if (typeof initShaderCanvas === 'function') {
        // Small delay to ensure card is rendered
        setTimeout(() => {
            initShaderCanvas(focusedCard, cardData, true); // focusMode = true for mouse tracking
        }, 100);
    }

    // Load lore data
    const lore = await loadLoreData(cardData.characterId);

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
function closeFocusMode() {
    // Only destroy the focused card's shader, not all shaders
    const focusWrapper = document.getElementById('focus-card-wrapper');
    const focusCard = focusWrapper ? focusWrapper.querySelector('.card') : null;

    if (focusCard && typeof destroyShaderCanvasForCard === 'function') {
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
 * Find card data by ID from inventory
 * @param {string} cardId 
 * @returns {Object|null}
 */
function findCardById(cardId) {
    return gameState.inventory.find(card => card.id === cardId) || null;
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Expose debug utilities to global scope for console access
window.testRngDistribution = testRngDistribution;
window.gameState = gameState;
window.openFocusMode = openFocusMode;

