/**
 * ============================================
 * RUNE STONES (Tic Tac Toe)
 * Ancient rune alignment game
 * ============================================
 */

import { GAMES_CONFIG } from './games.js';
import { gameState as appState, saveGame, updateCreditsDisplay } from '../state.js';

// ============================================
// GAME CONSTANTS
// ============================================

const BOARD_SIZE = 3;
const PLAYER_MARKER = 'X'; // Sun Rune
const AI_MARKER = 'O';     // Moon Rune

// Win patterns (indices on flat board array)
const WIN_PATTERNS = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal TL-BR
    [2, 4, 6]  // Diagonal TR-BL
];

const AI_THINKING_DELAY = 900;  // ms for AI "thinking"
const RESULT_DELAY = 800;       // ms before showing result

// Difficulty tiers configuration
const DIFFICULTY_TIERS = {
    normal: {
        label: 'Apprentice',
        description: 'Random moves',
        aiDepth: 0, // 0 = pure random
        rewardMultiplier: 1.0
    },
    hard: {
        label: 'Sage',
        description: 'Strategic opponent',
        aiDepth: 3, // Limited minimax depth
        rewardMultiplier: 2.0
    },
    hell: {
        label: 'Oracle',
        description: 'Perfect play',
        aiDepth: 9, // Full minimax (unbeatable)
        rewardMultiplier: 4.0
    }
};

// Base gem rewards (higher than RPS since games take longer)
const GEM_REWARDS = {
    baseWin: 75,
    draw: 40,
    lose: 0
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
    isPlaying: false,
    difficulty: null,
    board: Array(9).fill(null),
    currentTurn: 'player',
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

/**
 * Format gem amount with currency icon
 * @param {number} amount - Number of gems
 * @returns {string} HTML string with icon and amount
 */
function formatGems(amount) {
    return `+${amount} <img src="assets/ui/icon-currency.webp" alt="gems" class="dialogue-gem-icon">`;
}

function setDialogue(text) {
    const content = document.getElementById('game-content');
    const dialogueEl = content?.querySelector('.ttt-dialogue');
    if (dialogueEl) {
        dialogueEl.innerHTML = text;
    }
}

// ============================================
// GAME LOGIC
// ============================================

/**
 * Check if a player has won
 * @param {Array} board - Current board state
 * @param {string} marker - 'X' or 'O'
 * @returns {boolean}
 */
function checkWin(board, marker) {
    return WIN_PATTERNS.some(pattern =>
        pattern.every(index => board[index] === marker)
    );
}

/**
 * Check if board is full (draw)
 * @param {Array} board - Current board state
 * @returns {boolean}
 */
function checkDraw(board) {
    return board.every(cell => cell !== null);
}

/**
 * Get available moves (empty cells)
 * @param {Array} board - Current board state
 * @returns {Array} Array of indices
 */
function getAvailableMoves(board) {
    return board.map((cell, index) => cell === null ? index : null)
        .filter(index => index !== null);
}

/**
 * Minimax algorithm for AI decision making
 * @param {Array} board - Current board state
 * @param {number} depth - Current search depth
 * @param {boolean} isMaximizing - Is this the AI's turn?
 * @param {number} alpha - Alpha value for pruning
 * @param {number} beta - Beta value for pruning
 * @param {number} maxDepth - Maximum search depth
 * @returns {number} Score for this position
 */
function minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
    // Terminal states
    if (checkWin(board, AI_MARKER)) return 10 - depth;
    if (checkWin(board, PLAYER_MARKER)) return depth - 10;
    if (checkDraw(board) || depth >= maxDepth) return 0;

    const availableMoves = getAvailableMoves(board);

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of availableMoves) {
            board[move] = AI_MARKER;
            const score = minimax(board, depth + 1, false, alpha, beta, maxDepth);
            board[move] = null;
            maxScore = Math.max(score, maxScore);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (const move of availableMoves) {
            board[move] = PLAYER_MARKER;
            const score = minimax(board, depth + 1, true, alpha, beta, maxDepth);
            board[move] = null;
            minScore = Math.min(score, minScore);
            beta = Math.min(beta, score);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return minScore;
    }
}

/**
 * Get the AI's move based on difficulty
 * @returns {number} Index of chosen cell
 */
function getAIMove() {
    const tier = DIFFICULTY_TIERS[gameState.difficulty];
    const availableMoves = getAvailableMoves(gameState.board);

    if (availableMoves.length === 0) return -1;

    // Normal difficulty: pure random
    if (tier.aiDepth === 0) {
        const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        console.log('[AI Logic] Normal - Random move:', move);
        return move;
    }

    // Hard/Hell: Minimax with depth limit
    let bestMove = availableMoves[0];
    let bestScore = -Infinity;

    const debugLog = {
        difficulty: gameState.difficulty,
        depth: tier.aiDepth,
        moves: []
    };

    for (const move of availableMoves) {
        gameState.board[move] = AI_MARKER;
        const score = minimax(gameState.board, 0, false, -Infinity, Infinity, tier.aiDepth);
        gameState.board[move] = null;

        debugLog.moves.push({ move, score });

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    debugLog.bestMove = bestMove;
    debugLog.bestScore = bestScore;
    console.log('[AI Logic]', debugLog);

    return bestMove;
}

/**
 * Handle player clicking a cell
 * @param {number} index - Cell index (0-8)
 */
function handleCellClick(index) {
    // Ignore if not player's turn or cell is occupied
    if (gameState.currentTurn !== 'player' || gameState.board[index] !== null) {
        return;
    }

    // Place player's rune
    gameState.board[index] = PLAYER_MARKER;
    renderBoard();

    // Check for win/draw
    if (checkWin(gameState.board, PLAYER_MARKER)) {
        handleGameEnd('player');
        return;
    }

    if (checkDraw(gameState.board)) {
        handleGameEnd('draw');
        return;
    }

    // AI's turn
    gameState.currentTurn = 'ai';
    setDialogue('The stars reveal...');
    setAvatar('thinking');
    disableCells(true);

    // AI thinking delay
    setTimeout(() => {
        const aiMove = getAIMove();
        if (aiMove >= 0) {
            gameState.board[aiMove] = AI_MARKER;
            setAvatar('pencil');
            setDialogue('The moon rises here.');
            renderBoard();

            // Check for AI win/draw after delay
            setTimeout(() => {
                if (checkWin(gameState.board, AI_MARKER)) {
                    handleGameEnd('ai');
                    return;
                }

                if (checkDraw(gameState.board)) {
                    handleGameEnd('draw');
                    return;
                }

                // Back to player's turn
                gameState.currentTurn = 'player';
                setDialogue('I await your move...');
                setAvatar('thinking');
                disableCells(false);
            }, RESULT_DELAY);
        }
    }, AI_THINKING_DELAY);
}

/**
 * Handle game end (win/lose/draw)
 * @param {string} result - 'player', 'ai', or 'draw'
 */
function handleGameEnd(result) {
    gameState.result = result;
    const tier = DIFFICULTY_TIERS[gameState.difficulty];
    let gemsEarned = 0;

    switch (result) {
        case 'player':
            gameState.wins++;
            gemsEarned = Math.floor(GEM_REWARDS.baseWin * tier.rewardMultiplier);
            setAvatar('angry');
            setDialogue(`Your alignment... impressive. ${formatGems(gemsEarned)}`);
            break;

        case 'ai':
            gameState.losses++;
            gemsEarned = GEM_REWARDS.lose;
            setAvatar('happy');
            setDialogue('The stars foretold this victory!');
            break;

        case 'draw':
            gameState.draws++;
            gemsEarned = Math.floor(GEM_REWARDS.draw * tier.rewardMultiplier);
            setAvatar('surprised');
            setDialogue(`A cosmic stalemate! ${formatGems(gemsEarned)}`);
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

    // Disable board and show play again
    disableCells(true);
    showPlayAgainButton();
}

/**
 * Reset for a new game
 */
function resetGame() {
    gameState.board = Array(9).fill(null);
    gameState.currentTurn = 'player';
    gameState.result = null;

    setAvatar('thinking');
    setDialogue('Place your rune wisely, seeker...');
    renderBoard();
    disableCells(false);
    hidePlayAgainButton();
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Update the score display
 */
function updateScoreDisplay() {
    const scoreEl = document.getElementById('ttt-score');
    if (scoreEl) {
        scoreEl.textContent = `Wins: ${gameState.wins} | Losses: ${gameState.losses} | Draws: ${gameState.draws}`;
    }
}

/**
 * Render the game board
 */
function renderBoard() {
    const boardEl = document.getElementById('ttt-board');
    if (!boardEl) return;

    boardEl.innerHTML = '';

    gameState.board.forEach((cell, index) => {
        const cellEl = document.createElement('div');
        cellEl.className = 'ttt-cell';
        cellEl.dataset.index = index;

        if (cell) {
            const marker = document.createElement('div');
            marker.className = 'ttt-marker';

            const img = document.createElement('img');
            if (cell === PLAYER_MARKER) {
                img.src = 'assets/games/ttt/x_marker.webp';
                img.alt = 'Sun Rune';
                marker.classList.add('sun-rune');
            } else {
                img.src = 'assets/games/ttt/o_marker.webp';
                img.alt = 'Moon Rune';
                marker.classList.add('moon-rune');
            }

            marker.appendChild(img);
            cellEl.appendChild(marker);
            cellEl.classList.add('occupied');
        } else {
            cellEl.addEventListener('click', () => handleCellClick(index));
        }

        boardEl.appendChild(cellEl);
    });
}

/**
 * Disable/enable cell clicks
 * @param {boolean} disabled
 */
function disableCells(disabled) {
    const cells = document.querySelectorAll('.ttt-cell:not(.occupied)');
    cells.forEach(cell => {
        cell.classList.toggle('disabled', disabled);
        if (disabled) {
            cell.style.pointerEvents = 'none';
        } else {
            cell.style.pointerEvents = 'auto';
        }
    });
}

/**
 * Show play again button
 */
function showPlayAgainButton() {
    const controls = document.getElementById('ttt-controls');
    if (controls) {
        controls.innerHTML = `
            <button class="ttt-play-again-btn" onclick="window.tttPlayAgain()">
                Play Again
            </button>
            <button class="ttt-change-difficulty-btn" onclick="window.tttChangeDifficulty()">
                Change Difficulty
            </button>
        `;
    }
}

/**
 * Hide play again button
 */
function hidePlayAgainButton() {
    const controls = document.getElementById('ttt-controls');
    if (controls) {
        controls.innerHTML = '';
    }
}

/**
 * Return to difficulty selection (keeps session stats)
 */
function changeDifficulty() {
    gameState.difficulty = null;
    gameState.board = Array(9).fill(null);
    gameState.currentTurn = 'player';
    gameState.result = null;
    // Keep wins/losses/draws for the session

    setAvatar('thinking');
    renderDifficultySelect();
}

/**
 * Render difficulty selection UI
 */
function renderDifficultySelect() {
    const content = document.getElementById('game-content');
    const controls = document.getElementById('game-controls');

    if (content) {
        content.innerHTML = `
            <div class="ttt-game-container">
                <h2 class="ttt-title">Rune Stones</h2>
                <p class="ttt-subtitle">Align three runes to claim victory</p>
                <p class="ttt-dialogue">Choose your challenge level...</p>
            </div>
            <div class="ttt-difficulty-select">
                <button class="ttt-difficulty-btn" data-difficulty="normal" onclick="window.tttSetDifficulty('normal')">
                    <span class="ttt-diff-label">Apprentice</span>
                    <span class="ttt-diff-desc">Random moves • 1x rewards</span>
                </button>
                <button class="ttt-difficulty-btn" data-difficulty="hard" onclick="window.tttSetDifficulty('hard')">
                    <span class="ttt-diff-label">Sage</span>
                    <span class="ttt-diff-desc">Strategic opponent • 2x rewards</span>
                </button>
                <button class="ttt-difficulty-btn" data-difficulty="hell" onclick="window.tttSetDifficulty('hell')">
                    <span class="ttt-diff-label">Oracle</span>
                    <span class="ttt-diff-desc">Perfect play • 4x rewards</span>
                </button>
            </div>
        `;
    }

    if (controls) {
        controls.innerHTML = '';
    }
}

/**
 * Set difficulty and start game
 * @param {string} tier
 */
function setDifficulty(tier) {
    if (!DIFFICULTY_TIERS[tier]) return;

    gameState.difficulty = tier;
    console.log('[Rune Stones] Difficulty set to:', tier, DIFFICULTY_TIERS[tier]);

    renderGameUI();
    resetGame();
}

/**
 * Render the main game interface
 */
function renderGameUI() {
    const content = document.getElementById('game-content');
    const controls = document.getElementById('game-controls');
    const tier = DIFFICULTY_TIERS[gameState.difficulty];

    if (content) {
        content.innerHTML = `
            <div class="ttt-game-container">
                <h2 class="ttt-title">Rune Stones</h2>
                <p class="ttt-subtitle">Align three runes to claim victory</p>
                <p class="ttt-difficulty-badge" data-difficulty="${gameState.difficulty}">${tier.label} • ${tier.rewardMultiplier}x</p>
                <p class="ttt-dialogue" id="ttt-dialogue">Place your rune wisely, seeker...</p>
                <p class="ttt-score" id="ttt-score">Wins: 0 | Losses: 0 | Draws: 0</p>
            </div>
            <div class="ttt-board" id="ttt-board"></div>
            <div class="ttt-controls" id="ttt-controls"></div>
        `;
    }

    if (controls) {
        controls.innerHTML = '';
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the Rune Stones game
 */
export function initTTTGame() {
    // Reset game state
    gameState = {
        isPlaying: false,
        difficulty: null,
        board: Array(9).fill(null),
        currentTurn: 'player',
        result: null,
        wins: 0,
        losses: 0,
        draws: 0
    };

    // Set initial avatar
    setAvatar('thinking');

    // Show difficulty selection first
    renderDifficultySelect();
}

// ============================================
// GLOBAL EXPORTS (for onclick handlers)
// ============================================

window.tttSetDifficulty = setDifficulty;
window.tttPlayAgain = resetGame;
window.tttChangeDifficulty = changeDifficulty;

export default {
    initTTTGame
};
