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
        losesTo: 'water',
        avatar: 'throwFire'
    },
    water: {
        name: 'Water',
        emoji: '💧',
        beats: 'fire',
        losesTo: 'earth',
        avatar: 'throwWater'
    },
    earth: {
        name: 'Earth',
        emoji: '🌍',
        beats: 'water',
        losesTo: 'fire',
        avatar: 'throwEarth'
    }
};

const RESULT_DELAY = 1500; // ms before showing result
const AVATAR_CHANGE_DELAY = 500; // ms for avatar animation
const MOVE_HISTORY_SIZE = 10; // Number of moves to track for pattern analysis

// Difficulty tiers configuration
const DIFFICULTY_TIERS = {
    normal: {
        label: 'Challenger',
        description: 'A fair fight',
        predictionRate: 0, // 0% prediction, 100% random
        rewardMultiplier: 1.0,
        drawMultiplier: 1.0
    },
    hard: {
        label: 'Master',
        description: 'A challenging opponent',
        predictionRate: 0.70, // 70% prediction, 30% random
        rewardMultiplier: 2.0,
        drawMultiplier: 2.0
    },
    hell: {
        label: 'Nightmare',
        description: 'A near-perfect opponent',
        predictionRate: 0.85, // 85% prediction, 15% random
        rewardMultiplier: 4.0,
        drawMultiplier: 4.0,
        useSequenceDetection: true
    }
};

// Base gem rewards
const GEM_REWARDS = {
    baseWin: 50,
    draw: 25,
    lose: 0
};

// Win streak multipliers
const STREAK_MULTIPLIERS = {
    1: 1.0,   // 50 credits
    2: 1.5,   // 75 credits
    3: 2.0,   // 100 credits
    4: 3.0    // 150 credits (max)
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
    isPlaying: false,
    difficulty: null,
    playerChoice: null,
    aiChoice: null,
    result: null,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    moveHistory: [],      // Player's move history for pattern analysis
    lastResult: null,     // 'player', 'ai', or 'draw'
    lastPlayerMove: null, // For WSLS detection
    lastAIMove: null      // For WSLS detection
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
// AI PATTERN RECOGNITION
// ============================================

/**
 * Get the element that counters the given element
 */
function getCounterTo(element) {
    return ELEMENTS[element].losesTo;
}

/**
 * Analyze frequency of player moves and return most common
 */
function analyzeFrequency(history) {
    if (history.length === 0) return null;

    const frequency = { fire: 0, water: 0, earth: 0 };
    history.forEach(move => frequency[move]++);

    // Find the most frequent move
    let maxCount = 0;
    let mostFrequent = null;
    for (const [element, count] of Object.entries(frequency)) {
        if (count > maxCount) {
            maxCount = count;
            mostFrequent = element;
        }
    }

    return { prediction: mostFrequent, frequency, confidence: maxCount / history.length };
}

/**
 * Win-Stay/Lose-Shift prediction
 * - After winning, players often repeat the same move
 * - After losing, players often switch to what would have beaten the AI
 */
function predictWSLS(lastResult, playerLastMove, aiLastMove) {
    if (!lastResult || !playerLastMove || !aiLastMove) return null;

    if (lastResult === 'player') {
        // Win-Stay: Player won, likely to repeat
        return { prediction: playerLastMove, reason: 'Win-Stay' };
    } else if (lastResult === 'ai') {
        // Lose-Shift: Player lost, likely to shift to what beats AI's last move
        const likelyShift = getCounterTo(aiLastMove);
        return { prediction: likelyShift, reason: 'Lose-Shift' };
    }

    return null;
}

/**
 * Detect repeating sequences (2-move or 3-move cycles)
 */
function detectSequence(history) {
    if (history.length < 4) return null;

    const recent = history.slice(-6);

    // Check for 2-move cycle (A-B-A-B)
    if (recent.length >= 4) {
        const last4 = recent.slice(-4);
        if (last4[0] === last4[2] && last4[1] === last4[3]) {
            const nextInCycle = last4[0]; // Pattern repeats
            return { prediction: nextInCycle, pattern: '2-cycle', sequence: [last4[0], last4[1]] };
        }
    }

    // Check for 3-move cycle (A-B-C-A-B-C)
    if (recent.length >= 6) {
        const last6 = recent.slice(-6);
        if (last6[0] === last6[3] && last6[1] === last6[4] && last6[2] === last6[5]) {
            const nextInCycle = last6[0]; // Pattern repeats
            return { prediction: nextInCycle, pattern: '3-cycle', sequence: [last6[0], last6[1], last6[2]] };
        }
    }

    return null;
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
 * AI makes a choice based on difficulty
 */
function getAIChoice() {
    const choices = Object.keys(ELEMENTS);
    const tier = DIFFICULTY_TIERS[gameState.difficulty];

    // First move is always random
    if (gameState.moveHistory.length === 0) {
        const choice = choices[Math.floor(Math.random() * choices.length)];
        console.log('[AI Logic] First move - Random:', choice);
        return choice;
    }

    // Normal difficulty: pure random
    if (gameState.difficulty === 'normal') {
        const choice = choices[Math.floor(Math.random() * choices.length)];
        console.log('[AI Logic] Normal difficulty - Random:', choice);
        return choice;
    }

    // Hard/Hell: Pattern recognition
    const debugLog = {
        difficulty: gameState.difficulty,
        moveHistory: [...gameState.moveHistory],
        predictions: {}
    };

    // Collect predictions from different strategies
    let predictions = [];

    // 1. Frequency Analysis
    const freqResult = analyzeFrequency(gameState.moveHistory);
    if (freqResult && freqResult.confidence > 0.3) {
        predictions.push({
            source: 'Frequency',
            playerPrediction: freqResult.prediction,
            counter: getCounterTo(freqResult.prediction),
            weight: freqResult.confidence
        });
        debugLog.predictions.frequency = freqResult;
    }

    // 2. WSLS Detection
    const wslsResult = predictWSLS(gameState.lastResult, gameState.lastPlayerMove, gameState.lastAIMove);
    if (wslsResult) {
        predictions.push({
            source: wslsResult.reason,
            playerPrediction: wslsResult.prediction,
            counter: getCounterTo(wslsResult.prediction),
            weight: 0.6
        });
        debugLog.predictions.wsls = wslsResult;
    }

    // 3. Sequence Detection (Hell only)
    if (tier.useSequenceDetection) {
        const seqResult = detectSequence(gameState.moveHistory);
        if (seqResult) {
            predictions.push({
                source: `Sequence (${seqResult.pattern})`,
                playerPrediction: seqResult.prediction,
                counter: getCounterTo(seqResult.prediction),
                weight: 0.8 // High weight for detected patterns
            });
            debugLog.predictions.sequence = seqResult;
        }
    }

    // Decide: use prediction or random?
    const usePredict = Math.random() < tier.predictionRate;
    debugLog.predictionRoll = { threshold: tier.predictionRate, usePredict };

    let finalChoice;

    if (usePredict && predictions.length > 0) {
        // Sort by weight and pick highest confidence prediction
        predictions.sort((a, b) => b.weight - a.weight);
        const bestPrediction = predictions[0];
        finalChoice = bestPrediction.counter;
        debugLog.decision = {
            type: 'Predicted',
            source: bestPrediction.source,
            playerPrediction: bestPrediction.playerPrediction,
            counter: finalChoice
        };
    } else {
        // Random fallback
        finalChoice = choices[Math.floor(Math.random() * choices.length)];
        debugLog.decision = { type: 'Random fallback', choice: finalChoice };
    }

    console.log('[AI Logic]', debugLog);
    return finalChoice;
}

/**
 * Handle player's element selection
 */
function selectElement(element) {
    if (gameState.isPlaying) return;

    gameState.isPlaying = true;
    gameState.playerChoice = element;

    // Record move in history (before AI decision for fairness, but AI uses previous history)
    if (gameState.moveHistory.length >= MOVE_HISTORY_SIZE) {
        gameState.moveHistory.shift(); // Remove oldest
    }
    gameState.moveHistory.push(element);

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
    const tier = DIFFICULTY_TIERS[gameState.difficulty];

    let gemsEarned = 0;

    switch (gameState.result) {
        case 'player':
            gameState.wins++;
            gameState.winStreak++;
            const streakLevel = Math.min(gameState.winStreak, 4);
            const multiplier = STREAK_MULTIPLIERS[streakLevel];
            gemsEarned = Math.floor(GEM_REWARDS.baseWin * tier.rewardMultiplier * multiplier);
            setAvatar('angry'); // She's angry she lost
            if (gameState.winStreak > 1) {
                setDialogue(`${playerEl.name} beats ${aiEl.name}! ${gameState.winStreak}x streak! +${gemsEarned} 💎`);
            } else {
                setDialogue(`${playerEl.name} beats ${aiEl.name}! You win +${gemsEarned} 💎`);
            }
            break;

        case 'ai':
            gameState.losses++;
            gameState.winStreak = 0; // Reset streak on loss
            gemsEarned = GEM_REWARDS.lose;
            setAvatar('happy');
            setDialogue(`${aiEl.name} beats ${playerEl.name}! I win! Better luck next time~`);
            break;

        case 'draw':
            gameState.draws++;
            gameState.winStreak = 0; // Draws cancel streak
            gemsEarned = Math.floor(GEM_REWARDS.draw * tier.drawMultiplier);
            setAvatar('surprised');
            setDialogue(`We both chose ${playerEl.name}! It's a draw! Streak reset. +${gemsEarned} 💎`);
            break;
    }

    // Store last result for WSLS detection
    gameState.lastResult = gameState.result;
    gameState.lastPlayerMove = gameState.playerChoice;
    gameState.lastAIMove = gameState.aiChoice;

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
        difficulty: null,
        playerChoice: null,
        aiChoice: null,
        result: null,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        moveHistory: [],
        lastResult: null,
        lastPlayerMove: null,
        lastAIMove: null
    };

    // Set initial avatar
    setAvatar('thinking');

    // Show difficulty selection first
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
            <div class="rps-game-container">
                <h2 class="rps-title">Wizard Duel</h2>
                <p class="rps-subtitle">Fire beats Earth • Earth beats Water • Water beats Fire</p>
                <p class="rps-dialogue">Choose your challenge level...</p>
            </div>
            <div class="rps-difficulty-select">
                <button class="rps-difficulty-btn" data-difficulty="normal" onclick="window.rpsSetDifficulty('normal')">
                    <span class="rps-diff-label">Normal</span>
                    <span class="rps-diff-desc">A fair fight • 1x rewards</span>
                </button>
                <button class="rps-difficulty-btn" data-difficulty="hard" onclick="window.rpsSetDifficulty('hard')">
                    <span class="rps-diff-label">Hard</span>
                    <span class="rps-diff-desc">A challenging opponent • 2x rewards</span>
                </button>
                <button class="rps-difficulty-btn" data-difficulty="hell" onclick="window.rpsSetDifficulty('hell')">
                    <span class="rps-diff-label">Hell</span>
                    <span class="rps-diff-desc">A near-perfect opponent • 4x rewards</span>
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
 */
function setDifficulty(tier) {
    if (!DIFFICULTY_TIERS[tier]) return;

    gameState.difficulty = tier;
    console.log('[Wizard Duel] Difficulty set to:', tier, DIFFICULTY_TIERS[tier]);

    // Set dialogue for chosen difficulty
    setDialogue(`${DIFFICULTY_TIERS[tier].label} mode! Choose your element wisely, challenger!`);

    // Render game UI
    renderRPSUI();
}

/**
 * Render the RPS game interface
 */
function renderRPSUI() {
    const content = document.getElementById('game-content');
    const controls = document.getElementById('game-controls');
    const tier = DIFFICULTY_TIERS[gameState.difficulty];

    // Render text panel and controls together inside content area
    if (content) {
        content.innerHTML = `
            <div class="rps-game-container">
                <h2 class="rps-title">Wizard Duel</h2>
                <p class="rps-subtitle">Fire beats Earth • Earth beats Water • Water beats Fire</p>
                <p class="rps-difficulty-badge" data-difficulty="${gameState.difficulty}">${tier.label} • ${tier.rewardMultiplier}x</p>
                <p class="rps-dialogue" id="rps-dialogue">${tier.label} mode! Choose your element wisely, challenger!</p>
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
window.rpsSetDifficulty = setDifficulty;

export default {
    initRPSGame,
    ELEMENTS
};
