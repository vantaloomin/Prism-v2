// ============================================
// PROJECT PRISM - GAMES MODULE
// Game selection and gameplay logic
// ============================================

// ============================================
// GAMES CONFIGURATION
// ============================================

export const GAMES_CONFIG = {
    games: [
        {
            id: 'rps',
            name: 'Rock Paper Scissors',
            description: 'Test your luck against the AI!',
            icon: '/assets/games/icons/rps_icon.webp',
            fallbackIcon: '✊✋✌️'
        },
        {
            id: 'ttt',
            name: 'Tic Tac Toe',
            description: 'Classic strategy game',
            icon: '/assets/games/icons/ttt_icon.webp',
            fallbackIcon: '⭕❌'
        },
        {
            id: 'blackjack',
            name: 'Blackjack',
            description: 'Try to beat the dealer!',
            icon: '/assets/games/icons/blackjack_icon.webp',
            fallbackIcon: '🃏'
        }
    ],
    avatars: {
        neutral: '/assets/games/avatars/avatar_neutral.webp',
        happy: '/assets/games/avatars/avatar_happy.webp',
        sad: '/assets/games/avatars/avatar_sad.webp',
        thinking: '/assets/games/avatars/avatar_thinking.webp',
        surprised: '/assets/games/avatars/avatar_surprised.webp',
        throwRock: '/assets/games/avatars/avatar_throw_rock.webp',
        throwPaper: '/assets/games/avatars/avatar_throw_paper.webp',
        throwScissors: '/assets/games/avatars/avatar_throw_scissors.webp',
        pencil: '/assets/games/avatars/avatar_pencil.webp',
        cards: '/assets/games/avatars/avatar_cards.webp'
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
 * Render the games selection screen
 */
export function renderGamesSelection() {
    const container = document.getElementById('games-selection-container');
    if (!container) return;

    container.innerHTML = '';

    GAMES_CONFIG.games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.game = game.id;

        card.innerHTML = `
            <div class="game-card-icon">
                <img src="${game.icon}" alt="${game.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='${game.fallbackIcon}';">
            </div>
            <div class="game-card-name">${game.name}</div>
            <div class="game-card-desc">${game.description}</div>
        `;

        card.addEventListener('click', () => startGame(game.id));
        container.appendChild(card);
    });
}

/**
 * Start a specific game
 * @param {string} gameId - The game identifier
 */
export function startGame(gameId) {
    console.log(`Starting game: ${gameId}`);
    gamesState.currentGame = gameId;
    gamesState.isPlaying = true;

    // Hide selection, show play area
    const selectionContainer = document.getElementById('games-selection-container');
    const playArea = document.getElementById('games-play-area');

    if (selectionContainer) selectionContainer.style.display = 'none';
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

    if (playArea) {
        playArea.classList.remove('active');
        playArea.innerHTML = '';
    }
    if (selectionContainer) selectionContainer.style.display = 'flex';
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

    // Base structure with back button and VN-style avatar
    playArea.innerHTML = `
        <button class="game-back-btn" onclick="exitGame()">← Back to Games</button>
        <div class="game-avatar-container">
            <div class="game-content" id="game-content">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">${game.name}</h2>
                <p style="color: var(--text-secondary);">Game coming soon!</p>
            </div>
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
// (To be implemented in future)
// ============================================

function initRPSGame() {
    console.log('RPS game initialized (placeholder)');
    setAvatarExpression('neutral');

    const controls = document.getElementById('game-controls');
    if (controls) {
        controls.innerHTML = `
            <button class="game-btn" disabled>🪨 Rock</button>
            <button class="game-btn" disabled>📄 Paper</button>
            <button class="game-btn" disabled>✂️ Scissors</button>
        `;
    }

    const content = document.getElementById('game-content');
    if (content) {
        content.innerHTML = `
            <h2 style="color: var(--text-primary); margin-bottom: 20px;">Rock Paper Scissors</h2>
            <p style="color: var(--text-muted);">🚧 Coming soon! 🚧</p>
        `;
    }
}

function initTTTGame() {
    console.log('TTT game initialized (placeholder)');
    setAvatarExpression('pencil');

    const controls = document.getElementById('game-controls');
    if (controls) {
        controls.innerHTML = `<button class="game-btn" disabled>Start New Game</button>`;
    }

    const content = document.getElementById('game-content');
    if (content) {
        content.innerHTML = `
            <h2 style="color: var(--text-primary); margin-bottom: 20px;">Tic Tac Toe</h2>
            <p style="color: var(--text-muted);">🚧 Coming soon! 🚧</p>
        `;
    }
}

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
            <p style="color: var(--text-muted);">🚧 Coming soon! 🚧</p>
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
