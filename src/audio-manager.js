/**
 * PROJECT PRISM - Audio Manager
 * Central audio controller for SFX, Music, and Voice
 */

// ============================================
// AUDIO SETTINGS STATE
// ============================================

const AUDIO_STORAGE_KEY = 'prism_audio_settings';

// Default settings - all OFF by default per user request
const DEFAULT_SETTINGS = {
    sfxEnabled: false,
    sfxVolume: 0.8,
    voiceEnabled: false,
    voiceVolume: 0.8,
    musicEnabled: false,
    musicVolume: 0.8
};

let audioSettings = { ...DEFAULT_SETTINGS };

// Audio context (lazy initialization to avoid browser autoplay policies)
let audioContext = null;

// Audio cache for preloaded sounds
const audioCache = new Map();

// ============================================
// AUDIO MANIFEST
// ============================================

// Get base URL from Vite (handles both dev and production)
const BASE_URL = import.meta.env.BASE_URL || '/';

const AUDIO_MANIFEST = {
    sfx: {
        // RPS Element sounds
        element_fire: `${BASE_URL}assets/audio/games/rps/sfx/element_fire.mp3`,
        element_water: `${BASE_URL}assets/audio/games/rps/sfx/element_water.mp3`,
        element_earth: `${BASE_URL}assets/audio/games/rps/sfx/element_earth.mp3`
    },
    music: {
        // Future music tracks
    },
    voice: {
        // Future voice lines
    }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the audio system
 */
export function initAudio() {
    loadAudioSettings();
    console.log('✦ Audio system initialized!', audioSettings);
}

/**
 * Initialize AudioContext on first user interaction
 */
function ensureAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// ============================================
// PERSISTENCE
// ============================================

/**
 * Load audio settings from localStorage
 */
export function loadAudioSettings() {
    try {
        const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            audioSettings = { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load audio settings:', e);
    }
}

/**
 * Save audio settings to localStorage
 */
export function saveAudioSettings() {
    try {
        localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioSettings));
    } catch (e) {
        console.warn('Failed to save audio settings:', e);
    }
}

// ============================================
// SETTINGS GETTERS/SETTERS
// ============================================

/**
 * Get current audio settings
 */
export function getAudioSettings() {
    return { ...audioSettings };
}

/**
 * Set SFX enabled state
 */
export function setSFXEnabled(enabled) {
    audioSettings.sfxEnabled = enabled;
    saveAudioSettings();
}

/**
 * Set SFX volume (0-1)
 */
export function setSFXVolume(volume) {
    audioSettings.sfxVolume = Math.max(0, Math.min(1, volume));
    saveAudioSettings();
}

/**
 * Set Voice enabled state
 */
export function setVoiceEnabled(enabled) {
    audioSettings.voiceEnabled = enabled;
    saveAudioSettings();
}

/**
 * Set Voice volume (0-1)
 */
export function setVoiceVolume(volume) {
    audioSettings.voiceVolume = Math.max(0, Math.min(1, volume));
    saveAudioSettings();
}

/**
 * Set Music enabled state
 */
export function setMusicEnabled(enabled) {
    audioSettings.musicEnabled = enabled;
    saveAudioSettings();
}

/**
 * Set Music volume (0-1)
 */
export function setMusicVolume(volume) {
    audioSettings.musicVolume = Math.max(0, Math.min(1, volume));
    saveAudioSettings();
}

// ============================================
// AUDIO PLAYBACK
// ============================================

/**
 * Play a sound effect
 * @param {string} soundId - Key from AUDIO_MANIFEST.sfx
 * @param {Object} options - Optional { volume: 0-1 }
 */
export function playSFX(soundId, options = {}) {
    if (!audioSettings.sfxEnabled) return;

    const soundPath = AUDIO_MANIFEST.sfx[soundId];
    if (!soundPath) {
        console.warn(`[Audio] Unknown SFX: ${soundId}`);
        return;
    }

    const volume = (options.volume ?? 1) * audioSettings.sfxVolume;
    playSound(soundPath, volume);
}

/**
 * Play a voice line
 * @param {string} lineId - Key from AUDIO_MANIFEST.voice
 * @param {Object} options - Optional { volume: 0-1 }
 */
export function playVO(lineId, options = {}) {
    if (!audioSettings.voiceEnabled) return;

    const soundPath = AUDIO_MANIFEST.voice[lineId];
    if (!soundPath) {
        console.warn(`[Audio] Unknown VO: ${lineId}`);
        return;
    }

    const volume = (options.volume ?? 1) * audioSettings.voiceVolume;
    playSound(soundPath, volume);
}

/**
 * Internal: Play a sound file
 */
async function playSound(path, volume = 1) {
    try {
        ensureAudioContext();

        // Use HTML5 Audio for simplicity (works well for short SFX)
        const audio = new Audio(path);
        audio.volume = volume;
        await audio.play();
    } catch (e) {
        console.warn(`[Audio] Failed to play ${path}:`, e);
    }
}

// ============================================
// EXPORTS
// ============================================

// Expose to window for settings UI
window.audioManager = {
    getSettings: getAudioSettings,
    setSFXEnabled,
    setSFXVolume,
    setVoiceEnabled,
    setVoiceVolume,
    setMusicEnabled,
    setMusicVolume,
    playSFX,
    playVO
};

export default {
    initAudio,
    getAudioSettings,
    setSFXEnabled,
    setSFXVolume,
    setVoiceEnabled,
    setVoiceVolume,
    setMusicEnabled,
    setMusicVolume,
    playSFX,
    playVO
};
