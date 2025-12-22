/**
 * ============================================
 * DRAGON'S HAND (Blackjack)
 * Beat the dealer to 21!
 * ============================================
 */

import { GAMES_CONFIG } from './games.js';
import { gameState as appState, saveGame, updateCreditsDisplay } from '../state.js';

// ============================================
// GAME CONSTANTS
// ============================================

const SUITS = [
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' },
    { name: 'spades', symbol: '♠', color: 'black' }
];

const VALUES = [
    { display: 'A', value: 11, altValue: 1 },
    { display: '2', value: 2 },
    { display: '3', value: 3 },
    { display: '4', value: 4 },
    { display: '5', value: 5 },
    { display: '6', value: 6 },
    { display: '7', value: 7 },
    { display: '8', value: 8 },
    { display: '9', value: 9 },
    { display: '10', value: 10 },
    { display: 'J', value: 10 },
    { display: 'Q', value: 10 },
    { display: 'K', value: 10 }
];

// Timing constants
const DEAL_DELAY = 400;
const DEALER_PLAY_DELAY = 800;
const RESULT_DELAY = 1000;

// Fixed bet options
const BET_OPTIONS = [25, 100, 250];

// ============================================
// GAME STATE
// ============================================

let gameState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    phase: 'betting', // 'betting', 'playing', 'dealer-turn', 'result'
    result: null,
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0
};

// ============================================
// AVATAR MANAGEMENT
// ============================================

function setAvatar(expression) {
    const avatar = document.getElementById('game-avatar');
    if (avatar && GAMES_CONFIG.avatars[expression]) {
        avatar.src = GAMES_CONFIG.avatars[expression];

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

/**
 * Format gem amount with currency icon (no plus sign, for bets)
 * @param {number} amount - Number of gems
 * @returns {string} HTML string with icon and amount
 */
function formatGemsNoPlus(amount) {
    return `${amount} <img src="assets/ui/icon-currency.webp" alt="gems" class="dialogue-gem-icon">`;
}

function setDialogue(text) {
    const dialogueEl = document.getElementById('bj-dialogue');
    if (dialogueEl) {
        dialogueEl.innerHTML = text;
    }
}

// ============================================
// DECK MANAGEMENT
// ============================================

/**
 * Create a fresh 52-card deck
 */
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({
                suit: suit.name,
                suitSymbol: suit.symbol,
                suitColor: suit.color,
                display: value.display,
                value: value.value,
                altValue: value.altValue || null
            });
        }
    }
    return deck;
}

/**
 * Fisher-Yates shuffle
 */
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Draw a card from the deck
 */
function drawCard() {
    if (gameState.deck.length === 0) {
        // Reshuffle if deck is empty
        gameState.deck = shuffleDeck(createDeck());
    }
    const card = gameState.deck.pop();
    updateDeckCount();
    return card;
}

/**
 * Update the deck count display
 */
function updateDeckCount() {
    const deckCountEl = document.getElementById('bj-deck-count');
    if (deckCountEl) {
        deckCountEl.textContent = `${gameState.deck.length} cards`;
    }
}

// ============================================
// HAND CALCULATION
// ============================================

/**
 * Calculate the value of a hand, handling aces optimally
 */
function calculateHandValue(hand) {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
        total += card.value;
        if (card.altValue !== null) {
            aces++;
        }
    }

    // Convert aces from 11 to 1 if busting
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

/**
 * Check if a hand is busted
 */
function isBusted(hand) {
    return calculateHandValue(hand) > 21;
}

/**
 * Check if a hand is a natural blackjack (21 with 2 cards)
 */
function isBlackjack(hand) {
    return hand.length === 2 && calculateHandValue(hand) === 21;
}

// ============================================
// GAME LOGIC
// ============================================

/**
 * Deal initial cards
 */
async function dealCards() {
    gameState.phase = 'dealing';
    setAvatar('thinking');
    setDialogue('Dealing cards...');
    disableControls(true);

    // Deal 2 cards to player and dealer alternately
    for (let i = 0; i < 2; i++) {
        // Player card
        gameState.playerHand.push(drawCard());
        renderHands();
        await delay(DEAL_DELAY);

        // Dealer card (second card face down)
        const dealerCard = drawCard();
        dealerCard.faceDown = (i === 1);
        gameState.dealerHand.push(dealerCard);
        renderHands();
        await delay(DEAL_DELAY);
    }

    // Check for player blackjack
    if (isBlackjack(gameState.playerHand)) {
        gameState.blackjacks++;
        setDialogue('Blackjack! 🐉');
        setAvatar('surprised');
        await delay(RESULT_DELAY);

        // Reveal dealer card
        revealDealerCard();
        renderHands();

        if (isBlackjack(gameState.dealerHand)) {
            // Push - both have blackjack
            endGame('push');
        } else {
            // Player wins with blackjack (1.5x payout)
            endGame('blackjack');
        }
        return;
    }

    // Player's turn
    gameState.phase = 'playing';
    setAvatar('cards');
    setDialogue('Hit or Stand?');
    disableControls(false);
    updateHandDisplays();
}

/**
 * Player hits (takes another card)
 */
function playerHit() {
    if (gameState.phase !== 'playing') return;

    disableControls(true);
    const card = drawCard();
    gameState.playerHand.push(card);
    renderHands();
    updateHandDisplays();

    if (isBusted(gameState.playerHand)) {
        setDialogue('Bust! You went over 21.');
        setAvatar('happy');
        endGame('dealer');
    } else if (calculateHandValue(gameState.playerHand) === 21) {
        // Auto-stand on 21
        setDialogue('21! Standing automatically.');
        playerStand();
    } else {
        disableControls(false);
    }
}

/**
 * Player stands (ends their turn)
 */
async function playerStand() {
    if (gameState.phase !== 'playing') return;

    gameState.phase = 'dealer-turn';
    disableControls(true);
    setDialogue("Dealer's turn...");
    setAvatar('thinking');

    // Reveal dealer's face-down card
    revealDealerCard();
    renderHands();
    await delay(DEALER_PLAY_DELAY);

    // Dealer plays
    await dealerPlay();
}

/**
 * Reveal the dealer's face-down card
 */
function revealDealerCard() {
    for (const card of gameState.dealerHand) {
        card.faceDown = false;
    }
}

/**
 * Dealer AI: hits on 16 and below, stands on 17+
 */
async function dealerPlay() {
    updateHandDisplays();

    while (calculateHandValue(gameState.dealerHand) < 17) {
        setDialogue('Dealer hits...');
        await delay(DEALER_PLAY_DELAY);

        gameState.dealerHand.push(drawCard());
        renderHands();
        updateHandDisplays();
    }

    await delay(DEALER_PLAY_DELAY);

    // Determine winner
    if (isBusted(gameState.dealerHand)) {
        setDialogue('Dealer busts! You win!');
        endGame('player');
    } else {
        const playerValue = calculateHandValue(gameState.playerHand);
        const dealerValue = calculateHandValue(gameState.dealerHand);

        if (playerValue > dealerValue) {
            endGame('player');
        } else if (dealerValue > playerValue) {
            endGame('dealer');
        } else {
            endGame('push');
        }
    }
}

/**
 * End the game and calculate rewards
 */
function endGame(result) {
    gameState.phase = 'result';
    gameState.result = result;

    let creditsChange = 0;

    switch (result) {
        case 'player':
            gameState.wins++;
            creditsChange = gameState.currentBet;
            appState.credits += creditsChange;
            setDialogue(`You win! ${formatGems(creditsChange)}`);
            setAvatar('angry');
            break;

        case 'blackjack':
            gameState.wins++;
            // Blackjack pays 1.5x the bet
            creditsChange = Math.floor(gameState.currentBet * 1.5);
            appState.credits += creditsChange;
            setDialogue(`Blackjack! ${formatGems(creditsChange)}`);
            setAvatar('angry');
            break;

        case 'dealer':
            gameState.losses++;
            // Bet was already deducted
            setDialogue('Dealer wins. Better luck next time!');
            setAvatar('happy');
            break;

        case 'push':
            gameState.pushes++;
            // Return the bet
            appState.credits += gameState.currentBet;
            setDialogue("Push! It's a tie. Bet returned.");
            setAvatar('surprised');
            break;
    }

    saveGame();
    updateCreditsDisplay();
    updateScoreDisplay();
    showPlayAgainButton();
}

/**
 * Reset for a new hand
 */
function resetHand() {
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.currentBet = 0;
    gameState.phase = 'betting';
    gameState.result = null;

    hidePlayAgainButton();
    renderBettingUI();
}

// ============================================
// BETTING
// ============================================

/**
 * Place a bet
 */
function placeBet(amount) {
    // Validate bet is a valid option
    if (!BET_OPTIONS.includes(amount)) {
        setDialogue('Invalid bet amount!');
        return;
    }

    if (amount > appState.credits) {
        setDialogue("You don't have enough credits!");
        return;
    }

    // Deduct bet from credits
    gameState.currentBet = amount;
    appState.credits -= amount;
    saveGame();
    updateCreditsDisplay();

    // Start dealing
    dealCards();
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Render the hands on screen
 */
function renderHands() {
    const dealerHandEl = document.getElementById('bj-dealer-hand');
    const playerHandEl = document.getElementById('bj-player-hand');

    if (dealerHandEl) {
        dealerHandEl.innerHTML = gameState.dealerHand.map(card => renderCard(card)).join('');
    }

    if (playerHandEl) {
        playerHandEl.innerHTML = gameState.playerHand.map(card => renderCard(card)).join('');
    }
}

/**
 * Render a single card
 */
function renderCard(card) {
    if (card.faceDown) {
        return `
            <div class="bj-card face-down">
                <div class="bj-card-back"></div>
            </div>
        `;
    }

    return `
        <div class="bj-card ${card.suitColor}">
            <div class="bj-card-corner top-left">
                <span class="bj-card-value">${card.display}</span>
                <span class="bj-card-suit">${card.suitSymbol}</span>
            </div>
            <div class="bj-card-center">
                <span class="bj-card-suit-large">${card.suitSymbol}</span>
            </div>
            <div class="bj-card-corner bottom-right">
                <span class="bj-card-value">${card.display}</span>
                <span class="bj-card-suit">${card.suitSymbol}</span>
            </div>
        </div>
    `;
}

/**
 * Update the hand value displays
 */
function updateHandDisplays() {
    const playerValueEl = document.getElementById('bj-player-value');
    const dealerValueEl = document.getElementById('bj-dealer-value');

    if (playerValueEl) {
        playerValueEl.textContent = calculateHandValue(gameState.playerHand);
    }

    if (dealerValueEl) {
        // Only show dealer value if not hiding
        const hasHiddenCard = gameState.dealerHand.some(c => c.faceDown);
        if (hasHiddenCard) {
            // Show only the visible card's value
            const visibleCards = gameState.dealerHand.filter(c => !c.faceDown);
            dealerValueEl.textContent = calculateHandValue(visibleCards) + ' + ?';
        } else {
            dealerValueEl.textContent = calculateHandValue(gameState.dealerHand);
        }
    }
}

/**
 * Update the score display
 */
function updateScoreDisplay() {
    const scoreEl = document.getElementById('bj-score');
    if (scoreEl) {
        scoreEl.textContent = `Wins: ${gameState.wins} | Losses: ${gameState.losses} | Pushes: ${gameState.pushes}`;
    }
}

/**
 * Disable/enable game controls
 */
function disableControls(disabled) {
    const hitBtn = document.getElementById('bj-hit-btn');
    const standBtn = document.getElementById('bj-stand-btn');

    if (hitBtn) hitBtn.disabled = disabled;
    if (standBtn) standBtn.disabled = disabled;
}

/**
 * Show play again button
 */
function showPlayAgainButton() {
    const container = document.getElementById('bj-action-area');
    if (!container) return;

    container.innerHTML = `
        <div class="bj-action-buttons" id="bj-controls">
            <button class="bj-action-btn play-again" onclick="window.bjPlayAgain()">
                Play Again
            </button>
            <button class="bj-action-btn change-stakes" onclick="window.bjStartNewGame()">
                Reset Stats
            </button>
        </div>
    `;
}

/**
 * Hide play again button and show normal controls
 */
function hidePlayAgainButton() {
    // Will be re-rendered by renderBettingUI or renderGameUI
}

/**
 * Start a new game (reset stats and go to betting)
 */
function startNewGame() {
    gameState = {
        deck: shuffleDeck(createDeck()),
        playerHand: [],
        dealerHand: [],
        currentBet: 0,
        phase: 'betting',
        result: null,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0
    };

    renderBettingUI();
}

/**
 * Render the betting UI
 */
function renderBettingUI() {
    const content = document.getElementById('game-content');
    const controls = document.getElementById('game-controls');

    setAvatar('cards');

    // Filter bet options to only show affordable ones
    const betOptions = BET_OPTIONS.filter(bet => bet <= appState.credits);

    if (content) {
        content.innerHTML = `
            <div class="bj-game-container">
                <h2 class="bj-title">Dragon's Hand</h2>
                <p class="bj-subtitle">Beat the dealer to 21 without going bust!</p>
                <p class="bj-dialogue" id="bj-dialogue">Place your bet...</p>
                <p class="bj-score" id="bj-score">Wins: ${gameState.wins} | Losses: ${gameState.losses} | Pushes: ${gameState.pushes}</p>
            </div>
            <div class="bj-table">
                <div class="bj-hand-area dealer">
                    <div class="bj-hand-label">Dealer <span class="bj-hand-value" id="bj-dealer-value"></span></div>
                    <div class="bj-hand" id="bj-dealer-hand"></div>
                </div>
                <div class="bj-divider"></div>
                <div class="bj-hand-area player">
                    <div class="bj-hand" id="bj-player-hand"></div>
                    <div class="bj-hand-label">Your Hand <span class="bj-hand-value" id="bj-player-value"></span></div>
                </div>
            </div>
            <div class="bj-betting-area">
                <div class="bj-bet-options">
                    ${betOptions.length > 0 ? betOptions.map(bet => `
                        <button class="bj-bet-option" onclick="window.bjPlaceBet(${bet})">
                            ${bet} <img src="assets/ui/icon-currency.webp" alt="gems" class="dialogue-gem-icon">
                        </button>
                    `).join('') : '<p class="bj-no-credits">Not enough credits to play!</p>'}
                </div>
            </div>
            <div class="bj-action-area" id="bj-action-area"></div>
        `;
    }

    if (controls) {
        controls.innerHTML = '';
    }
}

/**
 * Render the main game UI with action buttons
 */
function renderGameUI() {
    const controls = document.getElementById('game-controls');

    // Update dialogue area
    const dialogueEl = document.getElementById('bj-dialogue');
    if (dialogueEl) {
        dialogueEl.innerHTML = `Bet: ${formatGemsNoPlus(gameState.currentBet)} - Hit or Stand?`;
    }

    // Hide betting area and show action buttons
    const bettingArea = document.querySelector('.bj-betting-area');
    if (bettingArea) {
        bettingArea.style.display = 'none';
    }

    // Clear the game-controls area (we don't use it for blackjack)
    if (controls) {
        controls.innerHTML = '';
    }

    // Render action buttons inside the game content area
    const actionArea = document.getElementById('bj-action-area');
    if (actionArea) {
        actionArea.innerHTML = `
            <div class="bj-action-buttons" id="bj-controls">
                <button class="bj-action-btn hit" id="bj-hit-btn" onclick="window.bjHit()">
                    <span class="bj-btn-icon"><img src="assets/ui/card_back.webp" alt="Hit" class="bj-btn-img"></span>
                    <span class="bj-btn-text">Hit</span>
                </button>
                <button class="bj-action-btn stand" id="bj-stand-btn" onclick="window.bjStand()">
                    <span class="bj-btn-icon">✋</span>
                    <span class="bj-btn-text">Stand</span>
                </button>
            </div>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the Dragon's Hand game
 */
export function initBlackjackGame() {
    // Reset game state with fresh deck
    gameState = {
        deck: shuffleDeck(createDeck()),
        playerHand: [],
        dealerHand: [],
        currentBet: 0,
        phase: 'betting',
        result: null,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0
    };

    // Go straight to betting UI
    renderBettingUI();
}

// ============================================
// UTILITY
// ============================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// GLOBAL EXPORTS (for onclick handlers)
// ============================================

window.bjPlaceBet = (amount) => {
    placeBet(amount);
    renderGameUI();
};
window.bjHit = playerHit;
window.bjStand = playerStand;
window.bjPlayAgain = resetHand;
window.bjStartNewGame = startNewGame;

export default {
    initBlackjackGame
};
