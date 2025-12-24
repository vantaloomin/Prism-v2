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
        element_earth: `${BASE_URL}assets/audio/games/rps/sfx/element_earth.mp3`,

        // Pack opening
        pack_burst: `${BASE_URL}assets/audio/sfx/pack_burst.mp3`,
        card_flip: `${BASE_URL}assets/audio/sfx/card_flip.mp3`,
        card_reveal_common: `${BASE_URL}assets/audio/sfx/card_reveal_common.mp3`,
        card_reveal_rare: `${BASE_URL}assets/audio/sfx/card_reveal_rare.mp3`,
        card_reveal_legendary: `${BASE_URL}assets/audio/sfx/card_reveal_legendary.mp3`,

        // UI
        button_click: `${BASE_URL}assets/audio/sfx/button_click.mp3`,
        button_hover: `${BASE_URL}assets/audio/sfx/button_hover.mp3`,
        modal_open: `${BASE_URL}assets/audio/ui/modal_open.mp3`,
        modal_close: `${BASE_URL}assets/audio/ui/modal_close.mp3`,
        tab_switch: `${BASE_URL}assets/audio/ui/tab_switch.mp3`,

        // Blackjack
        bj_card_deal: `${BASE_URL}assets/audio/games/blackjack/sfx/card_deal.mp3`,
        bj_chip_stack: `${BASE_URL}assets/audio/games/blackjack/sfx/chip_stack.mp3`,
        bj_win: `${BASE_URL}assets/audio/games/blackjack/sfx/win.mp3`,
        bj_lose: `${BASE_URL}assets/audio/games/blackjack/sfx/lose.mp3`,

        // TTT
        ttt_place: `${BASE_URL}assets/audio/games/ttt/sfx/place_piece.mp3`,
        ttt_win: `${BASE_URL}assets/audio/games/ttt/sfx/win.mp3`,
        ttt_draw: `${BASE_URL}assets/audio/games/ttt/sfx/draw.mp3`
    },
    music: {
        main_theme: `${BASE_URL}assets/audio/bgm/main_theme.mp3`,
        arcade_loop: `${BASE_URL}assets/audio/bgm/arcade_loop.mp3`,
        collection_ambient: `${BASE_URL}assets/audio/bgm/collection_ambient.mp3`
    },
    voice: {
        // Game Selection
        select_game: `${BASE_URL}assets/audio/voice/female/games/selection/select_game.mp3`,
        hover_wizard_duel: `${BASE_URL}assets/audio/voice/female/games/selection/wizard_duel_hover.mp3`,
        hover_rune_stones: `${BASE_URL}assets/audio/voice/female/games/selection/rune_stones_hover.mp3`,
        hover_dragons_hand: `${BASE_URL}assets/audio/voice/female/games/selection/dragons_hand_hover.mp3`,

        // Wizard Duel (RPS)
        rps_difficulty_normal: `${BASE_URL}assets/audio/voice/female/games/rps/difficulty_normal.mp3`,
        rps_difficulty_hard: `${BASE_URL}assets/audio/voice/female/games/rps/difficulty_hard.mp3`,
        rps_difficulty_hell: `${BASE_URL}assets/audio/voice/female/games/rps/difficulty_hell.mp3`,
        rps_player_fire: `${BASE_URL}assets/audio/voice/female/games/rps/player_chose_fire.mp3`,
        rps_player_water: `${BASE_URL}assets/audio/voice/female/games/rps/player_chose_water.mp3`,
        rps_player_earth: `${BASE_URL}assets/audio/voice/female/games/rps/player_chose_earth.mp3`,
        rps_ai_fire: `${BASE_URL}assets/audio/voice/female/games/rps/ai_chose_fire.mp3`,
        rps_ai_water: `${BASE_URL}assets/audio/voice/female/games/rps/ai_chose_water.mp3`,
        rps_ai_earth: `${BASE_URL}assets/audio/voice/female/games/rps/ai_chose_earth.mp3`,
        rps_player_wins: `${BASE_URL}assets/audio/voice/female/games/rps/player_wins.mp3`,
        rps_player_streak: `${BASE_URL}assets/audio/voice/female/games/rps/player_wins_streak.mp3`,
        rps_ai_wins: `${BASE_URL}assets/audio/voice/female/games/rps/ai_wins.mp3`,
        rps_draw: `${BASE_URL}assets/audio/voice/female/games/rps/draw.mp3`,

        // Rune Stones (TTT)
        ttt_place_rune: `${BASE_URL}assets/audio/voice/female/games/ttt/place_rune.mp3`,
        ttt_ai_thinking: `${BASE_URL}assets/audio/voice/female/games/ttt/ai_thinking.mp3`,
        ttt_ai_placed: `${BASE_URL}assets/audio/voice/female/games/ttt/ai_placed.mp3`,
        ttt_await_move: `${BASE_URL}assets/audio/voice/female/games/ttt/await_move.mp3`,
        ttt_player_wins: `${BASE_URL}assets/audio/voice/female/games/ttt/player_wins.mp3`,
        ttt_ai_wins: `${BASE_URL}assets/audio/voice/female/games/ttt/ai_wins.mp3`,
        ttt_draw: `${BASE_URL}assets/audio/voice/female/games/ttt/draw.mp3`,

        // Dragon's Hand (Blackjack)
        bj_dealing: `${BASE_URL}assets/audio/voice/female/games/blackjack/dealing.mp3`,
        bj_blackjack: `${BASE_URL}assets/audio/voice/female/games/blackjack/blackjack.mp3`,
        bj_hit_or_stand: `${BASE_URL}assets/audio/voice/female/games/blackjack/hit_or_stand.mp3`,
        bj_player_bust: `${BASE_URL}assets/audio/voice/female/games/blackjack/player_bust.mp3`,
        bj_player_21: `${BASE_URL}assets/audio/voice/female/games/blackjack/player_21.mp3`,
        bj_dealer_turn: `${BASE_URL}assets/audio/voice/female/games/blackjack/dealer_turn.mp3`,
        bj_dealer_hits: `${BASE_URL}assets/audio/voice/female/games/blackjack/dealer_hits.mp3`,
        bj_dealer_bust: `${BASE_URL}assets/audio/voice/female/games/blackjack/dealer_bust.mp3`,
        bj_player_wins: `${BASE_URL}assets/audio/voice/female/games/blackjack/player_wins.mp3`,
        bj_dealer_wins: `${BASE_URL}assets/audio/voice/female/games/blackjack/dealer_wins.mp3`,
        bj_push: `${BASE_URL}assets/audio/voice/female/games/blackjack/push.mp3`,
        bj_invalid_bet: `${BASE_URL}assets/audio/voice/female/games/blackjack/invalid_bet.mp3`,
        bj_not_enough: `${BASE_URL}assets/audio/voice/female/games/blackjack/not_enough.mp3`,

        // General
        welcome: `${BASE_URL}assets/audio/voice/female/welcome.mp3`,
        pack_open: `${BASE_URL}assets/audio/voice/female/pack_open.mp3`,
        rare_pull: `${BASE_URL}assets/audio/voice/female/rare_pull.mp3`
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
