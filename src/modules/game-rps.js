/**
 * ============================================
 * WIZARD DUEL (Rock Paper Scissors)
 * Fire > Earth > Water > Fire
 * ============================================
 */

import { GAMES_CONFIG } from './games.js';
import { gameState as appState, saveGame, updateCreditsDisplay } from '../state.js';

// ============================================
// GAME CONSTANTS
// ============================================

const ELEMENTS = {
    fire: {
        name: 'Fire',
        emoji: '🔥',
        beats: 'earth',
        avatar: 'throwFire'
    },
    water: {
        name: 'Water',
        emoji: '💧',
        beats: 'fire',
        avatar: 'throwWater'
    },
    earth: {
        name: 'Earth',
        emoji: '🌍',
        beats: 'water',
        avatar: 'throwEarth'
    }
};

const RESULT_DELAY = 1500; // ms before showing result
const AVATAR_CHANGE_DELAY = 500; // ms for avatar animation

// Gem rewards
const GEM_REWARDS = {
    win: 50,
    draw: 25,
    lose: 0
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
    isPlaying: false,
    playerChoice: null,
    aiChoice: null,
    result: null,
    wins: 0,
    losses: 0,
    draws: 0
};

// ============================================
// AVATAR MANAGEMENT
// ============================================

function setAvatar(expression) {
    const avatar = document.getElementById('game-avatar');
    if (avatar && GAMES_CONFIG.avatars[expression]) {
        avatar.src = GAMES_CONFIG.avatars[expression];

        // Add thinking animation class
        if (expression === 'thinking') {
            avatar.classList.add('thinking');
        } else {
            avatar.classList.remove('thinking');
        }
    }
}

// ============================================
// DIALOGUE MANAGEMENT
// ============================================

function setDialogue(text) {
    // Update the game content area with dialogue
    const content = document.getElementById('game-content');
    const dialogueEl = content?.querySelector('.rps-dialogue');
    if (dialogueEl) {
        dialogueEl.textContent = text;
    }
}

// ============================================
// GAME LOGIC
// ============================================

/**
 * Determine winner: returns 'player', 'ai', or 'draw'
 */
function determineWinner(playerChoice, aiChoice) {
    if (playerChoice === aiChoice) {
        return 'draw';
    }

    if (ELEMENTS[playerChoice].beats === aiChoice) {
        return 'player';
    }

    return 'ai';
}

/**
 * AI makes a random choice
 */
function getAIChoice() {
    const choices = Object.keys(ELEMENTS);
    return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Handle player's element selection
 */
function selectElement(element) {
    if (gameState.isPlaying) return;

    gameState.isPlaying = true;
    gameState.playerChoice = element;

    // Disable buttons
    disableElementButtons(true);

    // Show player's choice
    setDialogue(`You chose ${ELEMENTS[element].name}! Let me think...`);
    setAvatar('thinking');

    // AI "thinking" delay
    setTimeout(() => {
        // AI makes choice
        gameState.aiChoice = getAIChoice();

        // Show AI's element avatar
        setAvatar(ELEMENTS[gameState.aiChoice].avatar);
        setDialogue(`I choose ${ELEMENTS[gameState.aiChoice].name}!`);

        // Determine result after a short delay
        setTimeout(() => {
            showResult();
        }, RESULT_DELAY);

    }, AVATAR_CHANGE_DELAY);
}

/**
 * Show the game result
 */
function showResult() {
    gameState.result = determineWinner(gameState.playerChoice, gameState.aiChoice);

    const playerEl = ELEMENTS[gameState.playerChoice];
    const aiEl = ELEMENTS[gameState.aiChoice];

    let gemsEarned = 0;

    switch (gameState.result) {
        case 'player':
            gameState.wins++;
            gemsEarned = GEM_REWARDS.win;
            setAvatar('angry'); // She's angry she lost
            setDialogue(`${playerEl.name} beats ${aiEl.name}! You win +${gemsEarned} 💎`);
            break;

        case 'ai':
            gameState.losses++;
            gemsEarned = GEM_REWARDS.lose;
            setAvatar('happy');
            setDialogue(`${aiEl.name} beats ${playerEl.name}! I win! Better luck next time~`);
            break;

        case 'draw':
            gameState.draws++;
            gemsEarned = GEM_REWARDS.draw;
            setAvatar('surprised');
            setDialogue(`We both chose ${playerEl.name}! It's a draw! +${gemsEarned} 💎`);
            break;
    }

    // Award gems
    if (gemsEarned > 0) {
        appState.credits += gemsEarned;
        saveGame();
        updateCreditsDisplay();
    }

    // Update score display
    updateScoreDisplay();

    // Reset for next round
    gameState.isPlaying = false;
    gameState.playerChoice = null;
    gameState.aiChoice = null;
    gameState.result = null;

    // Re-enable buttons
    disableElementButtons(false);
}

/**
 * Update the score display
 */
function updateScoreDisplay() {
    const scoreEl = document.getElementById('rps-score');
    if (scoreEl) {
        scoreEl.textContent = `Wins: ${gameState.wins} | Losses: ${gameState.losses} | Draws: ${gameState.draws}`;
    }
}

/**
 * Disable/enable element selection buttons
 */
function disableElementButtons(disabled) {
    const buttons = document.querySelectorAll('.rps-element-btn');
    buttons.forEach(btn => {
        btn.disabled = disabled;
        btn.classList.toggle('disabled', disabled);
    });
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Initialize the Wizard Duel game
 */
export function initRPSGame() {
    // Reset game state
    gameState = {
        isPlaying: false,
        playerChoice: null,
        aiChoice: null,
        result: null,
        wins: 0,
        losses: 0,
        draws: 0
    };

    // Set initial avatar
    setAvatar('thinking');

    // Set initial dialogue
    setDialogue('Choose your element wisely, challenger!');

    // Render game UI
    renderRPSUI();
}

/**
 * Render the RPS game interface
 */
function renderRPSUI() {
    const content = document.getElementById('game-content');
    const controls = document.getElementById('game-controls');

    // Render text panel and controls together inside content area
    if (content) {
        content.innerHTML = `
            <div class="rps-game-container">
                <h2 class="rps-title">Wizard Duel</h2>
                <p class="rps-subtitle">Fire beats Earth • Earth beats Water • Water beats Fire</p>
                <p class="rps-dialogue" id="rps-dialogue">Choose your element wisely, challenger!</p>
                <p class="rps-score" id="rps-score">Wins: 0 | Losses: 0 | Draws: 0</p>
            </div>
            <div class="rps-elements">
                <button class="rps-element-btn" data-element="fire" onclick="window.rpsSelectElement('fire')">
                    <span class="rps-element-icon"><img src="assets/games/rps/fire.webp" alt="Fire"></span>
                    <span class="rps-element-name">Fire</span>
                </button>
                <button class="rps-element-btn" data-element="water" onclick="window.rpsSelectElement('water')">
                    <span class="rps-element-icon"><img src="assets/games/rps/water.webp" alt="Water"></span>
                    <span class="rps-element-name">Water</span>
                </button>
                <button class="rps-element-btn" data-element="earth" onclick="window.rpsSelectElement('earth')">
                    <span class="rps-element-icon"><img src="assets/games/rps/earth.webp" alt="Earth"></span>
                    <span class="rps-element-name">Earth</span>
                </button>
            </div>
        `;
    }

    // Clear the separate controls container (no longer needed for RPS)
    if (controls) {
        controls.innerHTML = '';
    }
}

// ============================================
// GLOBAL EXPORTS (for onclick handlers)
// ============================================

// Expose to window for onclick handlers
window.rpsSelectElement = selectElement;

export default {
    initRPSGame,
    ELEMENTS
};
