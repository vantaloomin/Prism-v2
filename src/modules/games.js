// ============================================
// PROJECT PRISM - GAMES MODULE
// Game selection and gameplay logic
// ============================================

import { initRPSGame } from './game-rps.js';
import { initTTTGame } from './game-ttt.js';
// ============================================
// GAMES CONFIGURATION
// ============================================

export const GAMES_CONFIG = {
    games: [
        {
            id: 'rps',
            name: 'Wizard Duel',
            description: 'Fire, Water, Earth - master the elements!',
            icon: 'assets/games/icons/rps_icon.webp',
            fallbackIcon: '🔥💧🌍',
            disabled: false
        },
        {
            id: 'ttt',
            name: 'Rune Stones',
            description: 'Align ancient runes on the stone tablet!',
            icon: 'assets/games/icons/ttt_icon.webp',
            fallbackIcon: '✦✧',
            disabled: false
        },
        {
            id: 'blackjack',
            name: 'Blackjack',
            description: 'Coming soon!',
            icon: 'assets/games/icons/blackjack_icon.webp',
            fallbackIcon: '🃏',
            disabled: true
        }
    ],
    avatars: {
        welcome: 'assets/games/avatars/avatar_welcome.webp',
        neutral: 'assets/games/avatars/avatar_neutral.webp',
        happy: 'assets/games/avatars/avatar_happy.webp',
        angry: 'assets/games/avatars/avatar_angry.webp',
        thinking: 'assets/games/avatars/avatar_thinking.webp',
        surprised: 'assets/games/avatars/avatar_surprised.webp',
        throwFire: 'assets/games/avatars/avatar_throw_fire.webp',
        throwWater: 'assets/games/avatars/avatar_throw_water.webp',
        throwEarth: 'assets/games/avatars/avatar_throw_earth.webp',
        pencil: 'assets/games/avatars/avatar_pencil.webp',
        cards: 'assets/games/avatars/avatar_cards.webp'
    }
};

// ============================================
// GAMES STATE
// ============================================

let gamesState = {
    currentGame: null,
    isPlaying: false
};

// ============================================
// GAMES UI RENDERING
// ============================================

/**
 * Render the VN-style games selection badges
 */
export function renderGamesSelection() {
    const container = document.getElementById('games-selection-container');
    if (!container) return;

    container.innerHTML = '';

    GAMES_CONFIG.games.forEach(game => {
        const badge = document.createElement('div');
        badge.className = 'vn-badge' + (game.disabled ? ' disabled' : '');
        badge.dataset.game = game.id;

        badge.innerHTML = `
            <div class="vn-badge-icon">
                <img src="${game.icon}" alt="${game.name}" 
                     onerror="this.style.display='none'; this.parentElement.textContent='${game.fallbackIcon}';">
            </div>
            <div class="vn-badge-name">${game.name}</div>
        `;

        if (!game.disabled) {
            badge.addEventListener('click', () => startGame(game.id));
        }
        badge.addEventListener('mouseenter', () => setDialogueText(game.description));
        badge.addEventListener('mouseleave', () => setDialogueText('Select a game to play.'));

        container.appendChild(badge);
    });
}

/**
 * Update the VN dialogue box text
 * @param {string} text - The text to display
 */
export function setDialogueText(text) {
    const dialogueText = document.getElementById('vn-dialogue-text');
    if (dialogueText) {
        dialogueText.textContent = text;
    }
}

/**
 * Start a specific game
 * @param {string} gameId - The game identifier
 */
export function startGame(gameId) {
    console.log(`Starting game: ${gameId}`);
    gamesState.currentGame = gameId;
    gamesState.isPlaying = true;

    // Hide VN selection elements
    const selectionContainer = document.getElementById('games-selection-container');
    const playArea = document.getElementById('games-play-area');
    const vnAvatarContainer = document.querySelector('.vn-avatar-container');
    const vnDialogueBox = document.querySelector('.vn-dialogue-box');

    if (selectionContainer) selectionContainer.style.display = 'none';
    if (vnAvatarContainer) vnAvatarContainer.style.display = 'none';
    if (vnDialogueBox) vnDialogueBox.style.display = 'none';

    if (playArea) {
        playArea.classList.add('active');
        renderGamePlayArea(gameId);
    }
}

/**
 * Return to game selection
 */
export function exitGame() {
    gamesState.currentGame = null;
    gamesState.isPlaying = false;

    const selectionContainer = document.getElementById('games-selection-container');
    const playArea = document.getElementById('games-play-area');
    const vnAvatarContainer = document.querySelector('.vn-avatar-container');
    const vnDialogueBox = document.querySelector('.vn-dialogue-box');

    if (playArea) {
        playArea.classList.remove('active');
        playArea.innerHTML = '';
    }

    // Restore VN selection elements
    if (selectionContainer) selectionContainer.style.display = 'flex';
    if (vnAvatarContainer) vnAvatarContainer.style.display = '';
    if (vnDialogueBox) vnDialogueBox.style.display = '';
}

/**
 * Render the game play area for a specific game
 * @param {string} gameId - The game identifier
 */
function renderGamePlayArea(gameId) {
    const playArea = document.getElementById('games-play-area');
    if (!playArea) return;

    const game = GAMES_CONFIG.games.find(g => g.id === gameId);
    if (!game) return;

    // Base structure with back button, centered content, and VN-style avatar
    playArea.innerHTML = `
        <button class="game-back-btn" onclick="exitGame()">← Back to Games</button>
        <div class="game-content" id="game-content">
            <h2 style="color: var(--text-primary); margin-bottom: 20px;">${game.name}</h2>
            <p style="color: var(--text-secondary);">Game coming soon!</p>
        </div>
        <div class="game-avatar-container">
            <img class="game-avatar" id="game-avatar" src="${GAMES_CONFIG.avatars.neutral}" alt="AI Avatar" 
                 onerror="this.style.display='none';">
        </div>
        <div class="game-controls" id="game-controls">
            <!-- Game-specific controls will be injected here -->
        </div>
    `;

    // Initialize game-specific content
    switch (gameId) {
        case 'rps':
            initRPSGame();
            break;
        case 'ttt':
            initTTTGame();
            break;
        case 'blackjack':
            initBlackjackGame();
            break;
    }
}

/**
 * Update the AI avatar expression
 * @param {string} expression - The expression key from GAMES_CONFIG.avatars
 */
export function setAvatarExpression(expression) {
    const avatar = document.getElementById('game-avatar');
    if (!avatar) return;

    const src = GAMES_CONFIG.avatars[expression];
    if (src) {
        avatar.src = src;

        // Add thinking animation class
        if (expression === 'thinking') {
            avatar.classList.add('thinking');
        } else {
            avatar.classList.remove('thinking');
        }
    }
}

// ============================================
// PLACEHOLDER GAME INITIALIZERS
// (RPS is now in game-rps.js)
// ============================================

// TTT game is now in game-ttt.js

function initBlackjackGame() {
    console.log('Blackjack game initialized (placeholder)');
    setAvatarExpression('cards');

    const controls = document.getElementById('game-controls');
    if (controls) {
        controls.innerHTML = `
            <button class="game-btn" disabled>Hit</button>
            <button class="game-btn" disabled>Stand</button>
        `;
    }

    const content = document.getElementById('game-content');
    if (content) {
        content.innerHTML = `
            <h2 style="color: var(--text-primary); margin-bottom: 20px;">Blackjack</h2>
            <p style="color: var(--text-muted);">Coming soon!</p>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the games module
 */
export function initGames() {
    renderGamesSelection();
    console.log('Games module initialized');
}

console.log('Games module loaded');
