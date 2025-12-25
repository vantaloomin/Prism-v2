/**
 * AETHEL SAGA - Save Transfer Module
 * Export and import save data via file download or Base64 codes
 */

import { gameState, collectionViewSettings, saveGame, loadGame } from './state.js';
import { CONFIG } from './engines/pack-logic.js';

// Current save format version for future compatibility
const SAVE_VERSION = 1;

// Audio storage key (matches audio-manager.js)
const AUDIO_STORAGE_KEY = 'aethel_saga_audio_settings';

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Collect all save data into a single exportable object
 */
export function getSaveData() {
    // Get audio settings if they exist
    let audioSettings = null;
    try {
        const savedAudio = localStorage.getItem(AUDIO_STORAGE_KEY);
        if (savedAudio) {
            audioSettings = JSON.parse(savedAudio);
        }
    } catch (e) {
        console.warn('Could not read audio settings for export:', e);
    }

    return {
        version: SAVE_VERSION,
        exportedAt: new Date().toISOString(),
        credits: gameState.credits,
        inventory: gameState.inventory,
        stats: gameState.stats,
        collectionSettings: collectionViewSettings,
        audio: audioSettings
    };
}

/**
 * Export save data as a downloadable JSON file
 */
export function exportAsFile() {
    const saveData = getSaveData();
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create timestamped filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `aethel-saga-save-${date}.json`;

    // Create download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename };
}

/**
 * Export save data as a Base64-encoded string and copy to clipboard
 */
export async function exportAsCode() {
    const saveData = getSaveData();
    const jsonString = JSON.stringify(saveData);
    const base64 = btoa(jsonString);

    try {
        await navigator.clipboard.writeText(base64);
        return { success: true, copied: true, code: base64 };
    } catch (e) {
        // Clipboard API failed, return the code for manual copying
        console.warn('Clipboard write failed:', e);
        return { success: true, copied: false, code: base64 };
    }
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Validate save data structure and types
 */
export function validateSaveData(data) {
    const errors = [];

    // Check required fields
    if (typeof data.credits !== 'number' || data.credits < 0) {
        errors.push('Invalid or negative credits value');
    }

    if (!Array.isArray(data.inventory)) {
        errors.push('Inventory must be an array');
    }

    if (typeof data.stats !== 'object' || data.stats === null) {
        errors.push('Stats must be an object');
    }

    // Validate inventory items if present
    if (Array.isArray(data.inventory)) {
        data.inventory.forEach((item, index) => {
            if (!item.id || typeof item.id !== 'string') {
                errors.push(`Inventory item ${index} missing valid id`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Apply imported save data to game state
 */
export function applySaveData(data) {
    // Update game state
    gameState.credits = data.credits ?? CONFIG.STARTING_CREDITS;
    gameState.inventory = data.inventory ?? [];
    gameState.stats = data.stats ?? { packsOpened: 0, totalCards: 0 };

    // Apply collection view settings if present
    if (data.collectionSettings) {
        Object.assign(collectionViewSettings, data.collectionSettings);
        // Ensure filters object is complete
        if (data.collectionSettings.filters) {
            collectionViewSettings.filters = {
                rarity: [],
                frame: [],
                holo: [],
                pack: [],
                ...data.collectionSettings.filters
            };
        }
    }

    // Save to localStorage
    saveGame();

    // Apply audio settings if present
    if (data.audio) {
        try {
            localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(data.audio));
        } catch (e) {
            console.warn('Could not save audio settings:', e);
        }
    }

    // Reload to apply all changes
    location.reload();
}

/**
 * Import save data from a JSON file
 */
export function importFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const validation = validateSaveData(data);

                if (!validation.valid) {
                    reject(new Error(`Invalid save file: ${validation.errors.join(', ')}`));
                    return;
                }

                resolve(data);
            } catch (e) {
                reject(new Error('Failed to parse save file. Make sure it\'s a valid JSON file.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };

        reader.readAsText(file);
    });
}

/**
 * Import save data from a Base64-encoded string
 */
export function importFromCode(code) {
    return new Promise((resolve, reject) => {
        try {
            // Clean up the code (remove whitespace)
            const cleanCode = code.trim();

            // Decode Base64
            const jsonString = atob(cleanCode);
            const data = JSON.parse(jsonString);

            const validation = validateSaveData(data);

            if (!validation.valid) {
                reject(new Error(`Invalid save code: ${validation.errors.join(', ')}`));
                return;
            }

            resolve(data);
        } catch (e) {
            if (e.message.includes('Invalid save code')) {
                reject(e);
            } else {
                reject(new Error('Invalid save code. Make sure you copied the entire code.'));
            }
        }
    });
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Show status message in the Data tab
 */
export function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('save-transfer-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `settings-status settings-status-${type}`;
    statusEl.classList.add('active');

    // Auto-hide after delay (except for errors)
    if (type !== 'error') {
        setTimeout(() => {
            statusEl.classList.remove('active');
        }, 3000);
    }
}

/**
 * Initialize save transfer event listeners
 */
export function initSaveTransfer() {
    // Export as file
    const exportFileBtn = document.getElementById('btn-export-file');
    if (exportFileBtn) {
        exportFileBtn.addEventListener('click', () => {
            const result = exportAsFile();
            if (result.success) {
                showStatus(`Saved to ${result.filename}`, 'success');
            }
        });
    }

    // Export as code
    const exportCodeBtn = document.getElementById('btn-export-code');
    if (exportCodeBtn) {
        exportCodeBtn.addEventListener('click', async () => {
            const result = await exportAsCode();
            if (result.copied) {
                showStatus('Save code copied to clipboard!', 'success');
            } else {
                showStatus('Code generated - clipboard unavailable', 'info');
                // Could show the code in a modal here if needed
            }
        });
    }

    // Import from file - trigger hidden file input
    const importFileBtn = document.getElementById('btn-import-file');
    const importFileInput = document.getElementById('import-file-input');
    if (importFileBtn && importFileInput) {
        importFileBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const data = await importFromFile(file);
                showStatus('Save loaded! Reloading...', 'success');
                setTimeout(() => applySaveData(data), 500);
            } catch (err) {
                showStatus(err.message, 'error');
            }

            // Reset input so same file can be selected again
            importFileInput.value = '';
        });
    }

    // Import from code
    const importCodeBtn = document.getElementById('btn-import-code');
    const importCodeInput = document.getElementById('import-code-input');
    if (importCodeBtn && importCodeInput) {
        importCodeBtn.addEventListener('click', async () => {
            const code = importCodeInput.value;
            if (!code.trim()) {
                showStatus('Please paste a save code first', 'error');
                return;
            }

            try {
                const data = await importFromCode(code);
                showStatus('Save loaded! Reloading...', 'success');
                setTimeout(() => applySaveData(data), 500);
            } catch (err) {
                showStatus(err.message, 'error');
            }
        });
    }
}
