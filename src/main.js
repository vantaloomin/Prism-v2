/**
 * PROJECT PRISM - Main Entry Point
 * Application initialization and navigation
 */

// Core imports
import { CONFIG, rollRarity, rollFrame, rollHolo } from './engines/pack-logic.js';
import { gameState, loadGame, saveGame, resetSave, updateCreditsDisplay } from './state.js';
import { handlePackPurchase, showPackShop } from './shop.js';
import { renderCollection } from './collection.js';
import { openFocusMode, closeFocusMode } from './focus.js';
import { initGames, exitGame } from './modules/games.js';
import { setAnimationsEnabled, destroyShaderCanvas } from './engines/shader-engine.js';

// ============================================
// TAB CONFIGURATION
// ============================================

const TAB_TITLES = {
    shop: { icon: '🎁', label: 'Open Pack' },
    games: { icon: '🎮', label: 'Games' },
    collection: { icon: '📚', label: 'Collection' }
};

// ============================================
// LANDING PAGE
// ============================================

/**
 * Show the landing page (hide app UI)
 */
function showLandingPage() {
    const landingPage = document.getElementById('landing-page');
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const mainContent = document.getElementById('main-content');

    // Show landing
    if (landingPage) landingPage.classList.remove('hidden');

    // Hide app UI
    if (topBar) topBar.classList.add('hidden');
    if (bottomNav) bottomNav.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');

    // Update landing page credits display
    const landingCredits = document.getElementById('landing-credits-amount');
    if (landingCredits) {
        landingCredits.textContent = gameState.credits;
    }
}

/**
 * Hide the landing page and show the main app UI
 */
function hideLandingPage() {
    const landingPage = document.getElementById('landing-page');
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const mainContent = document.getElementById('main-content');

    // Hide landing
    if (landingPage) landingPage.classList.add('hidden');

    // Show app UI
    if (topBar) topBar.classList.remove('hidden');
    if (bottomNav) bottomNav.classList.remove('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
}

/**
 * Update the top bar title based on current tab
 * @param {string} tabId - 'shop', 'games', or 'collection'
 */
function updateTopBarTitle(tabId) {
    const titleEl = document.getElementById('top-bar-title');
    if (!titleEl) return;

    const config = TAB_TITLES[tabId] || TAB_TITLES.shop;
    titleEl.innerHTML = `<span class="icon">${config.icon}</span><span>${config.label}</span>`;
}

/**
 * Navigate from landing page to a specific tab
 * @param {string} tabId - 'shop', 'games', or 'collection'
 */
function navigateFromLanding(tabId) {
    hideLandingPage();
    switchTab(tabId);
}

// ============================================
// SETTINGS MODAL
// ============================================

/**
 * Open the settings modal
 */
function openSettingsModal() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * Close the settings modal
 */
function closeSettingsModal() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================
// TAB NAVIGATION
// ============================================

/**
 * Switch between tabs
 * @param {string} tabId - 'shop', 'games', or 'collection'
 */
function switchTab(tabId) {
    // Cleanup before switching
    if (tabId !== 'shop') {
        destroyShaderCanvas();
    }
    if (tabId !== 'collection') {
        destroyShaderCanvas();
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-content-${tabId}`);
    });

    // Update top bar title
    updateTopBarTitle(tabId);

    // Tab-specific initialization
    if (tabId === 'collection') {
        renderCollection(null, openFocusMode);
    } else if (tabId === 'games') {
        initGames();
    }
}

// ============================================
// DEBUG UTILITIES
// ============================================

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

function init() {
    // Load saved data
    loadGame();

    // Update UI
    updateCreditsDisplay();
    renderCollection(null, openFocusMode);

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

    // Bottom navigation tab switching
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Bind pack buttons
    document.getElementById('btn-waifu-pack').addEventListener('click', () => {
        handlePackPurchase('waifu', openFocusMode);
    });

    document.getElementById('btn-husbando-pack').addEventListener('click', () => {
        handlePackPurchase('husbando', openFocusMode);
    });

    document.getElementById('btn-debug-pack').addEventListener('click', () => {
        handlePackPurchase('debug', openFocusMode);
    });

    document.getElementById('btn-debug-frame-pack').addEventListener('click', () => {
        handlePackPurchase('debug-frame', openFocusMode);
    });

    document.getElementById('btn-debug-holo-pack').addEventListener('click', () => {
        handlePackPurchase('debug-holo', openFocusMode);
    });



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

    // Escape key to close overlays or return to landing
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check settings modal first (highest priority)
            const settingsOverlay = document.getElementById('settings-overlay');
            if (settingsOverlay && settingsOverlay.classList.contains('active')) {
                closeSettingsModal();
                return;
            }

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
            setAnimationsEnabled(e.target.checked);
        });
    }

    // Reset save button
    document.getElementById('btn-reset').addEventListener('click', resetSave);

    // Settings modal controls
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnSettings = document.getElementById('btn-settings');
    const btnLandingSettings = document.getElementById('btn-landing-settings');
    const btnSettingsClose = document.getElementById('settings-close');

    if (btnSettings) {
        btnSettings.addEventListener('click', openSettingsModal);
    }
    if (btnLandingSettings) {
        btnLandingSettings.addEventListener('click', openSettingsModal);
    }
    if (btnSettingsClose) {
        btnSettingsClose.addEventListener('click', closeSettingsModal);
    }
    // Close on backdrop click
    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', (e) => {
            if (e.target === settingsOverlay) {
                closeSettingsModal();
            }
        });
    }

    console.log('✦ Project Prism initialized! ✦');
    console.log('Debug: Run testRngDistribution(1000) to test RNG');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Expose debug utilities to global scope for console access
window.testRngDistribution = testRngDistribution;
window.gameState = gameState;
window.openFocusMode = openFocusMode;
window.exitGame = exitGame;
