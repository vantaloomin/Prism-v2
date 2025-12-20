/**
 * PROJECT PRISM - State Module
 * Core game state and persistence
 */

import { CONFIG } from './engines/pack-logic.js';

// ============================================
// GAME STATE
// ============================================

export const gameState = {
    credits: CONFIG.STARTING_CREDITS,
    inventory: [],
    stats: {
        packsOpened: 0,
        totalCards: 0
    }
};

// Collection state for pagination
export const collectionState = {
    currentPage: 1
};

// ============================================
// PERSISTENCE (localStorage)
// ============================================

/**
 * Save game state to localStorage
 */
export function saveGame() {
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
export function loadGame() {
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
export function resetSave() {
    const overlay = document.getElementById('confirm-overlay');
    const cancelBtn = document.getElementById('confirm-cancel');
    const deleteBtn = document.getElementById('confirm-delete');

    if (!overlay || !cancelBtn || !deleteBtn) {
        // Fallback to browser confirm if elements don't exist
        if (confirm('Are you sure you want to delete all your progress? This cannot be undone!')) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            console.log('Save data reset!');
            location.reload();
        }
        return;
    }

    // Show custom confirmation dialog
    overlay.classList.add('active');

    // Handle cancel
    const handleCancel = () => {
        overlay.classList.remove('active');
        cleanup();
    };

    // Handle confirm delete
    const handleDelete = () => {
        overlay.classList.remove('active');
        cleanup();
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        console.log('Save data reset!');
        // Force full page refresh to reinitialize all state
        location.reload();
    };

    // Cleanup event listeners
    const cleanup = () => {
        cancelBtn.removeEventListener('click', handleCancel);
        deleteBtn.removeEventListener('click', handleDelete);
    };

    cancelBtn.addEventListener('click', handleCancel);
    deleteBtn.addEventListener('click', handleDelete);
}

/**
 * Update the credits display
 */
export function updateCreditsDisplay() {
    const creditsEl = document.getElementById('credits-amount');
    if (creditsEl) {
        creditsEl.textContent = gameState.credits;
    }

    // Update landing page credits too
    const landingCredits = document.getElementById('landing-credits-amount');
    if (landingCredits) {
        landingCredits.textContent = gameState.credits;
    }

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
