/**
 * PROJECT PRISM - Collection Module
 * Collection rendering and shader initialization
 */

import { gameState, collectionState } from './state.js';
import {
    createCardElement,
    getRaritySortOrder,
    getFrameSortOrder,
    getHoloSortOrder,
    getCardGroupKey
} from './card.js';
import { applyShaderTexture } from './engines/shader-engine.js';

// ============================================
// COLLECTION RENDERING
// ============================================

/**
 * Render the collection view with sorted, grouped cards
 * @param {number|null} page - Page number (null = current page)
 * @param {Function} onFocusClick - Callback for focus mode
 */
export function renderCollection(page = null, onFocusClick = null) {
    const container = document.getElementById('collection-container');
    const uniqueCount = document.getElementById('unique-count');
    const totalCount = document.getElementById('total-count');
    const badge = document.getElementById('collection-badge');

    // Cards per page (5 columns × 4 rows = 20)
    const CARDS_PER_PAGE = 20;

    // Update counts
    totalCount.textContent = gameState.inventory.length;
    badge.textContent = gameState.inventory.length;

    if (gameState.inventory.length === 0) {
        container.innerHTML = `
            <div class="binder-grid">
                <div class="gallery-empty" style="grid-column: 1 / -1;">
                    <div class="gallery-empty-icon">📦</div>
                    <p>No cards yet. Open a pack to start your collection!</p>
                </div>
            </div>
        `;
        uniqueCount.textContent = '0';
        return;
    }

    // Group cards by unique combo (character + frame + holo)
    const cardGroups = {};
    gameState.inventory.forEach(card => {
        const key = getCardGroupKey(card);
        if (!cardGroups[key]) {
            cardGroups[key] = {
                card: card,
                count: 0
            };
        }
        cardGroups[key].count++;
    });

    // Convert to array and sort (Common → UR, White → Black, None → Void)
    const sortedGroups = Object.values(cardGroups);
    sortedGroups.sort((a, b) => {
        // Sort by rarity
        const rarityDiff = getRaritySortOrder(a.card.rarity.id) - getRaritySortOrder(b.card.rarity.id);
        if (rarityDiff !== 0) return rarityDiff;

        // Then by frame
        const frameDiff = getFrameSortOrder(a.card.frame.id) - getFrameSortOrder(b.card.frame.id);
        if (frameDiff !== 0) return frameDiff;

        // Then by holo
        const holoDiff = getHoloSortOrder(a.card.holo.id) - getHoloSortOrder(b.card.holo.id);
        if (holoDiff !== 0) return holoDiff;

        // Finally by name
        return a.card.name.localeCompare(b.card.name);
    });

    uniqueCount.textContent = sortedGroups.length;

    // Pagination
    const totalPages = Math.ceil(sortedGroups.length / CARDS_PER_PAGE);
    const currentPage = page !== null ? page : (collectionState.currentPage || 1);
    collectionState.currentPage = Math.max(1, Math.min(currentPage, totalPages));

    const startIdx = (collectionState.currentPage - 1) * CARDS_PER_PAGE;
    const endIdx = Math.min(startIdx + CARDS_PER_PAGE, sortedGroups.length);
    const pageGroups = sortedGroups.slice(startIdx, endIdx);

    // Render binder grid
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'binder-grid';

    pageGroups.forEach(group => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collection-card-wrapper';

        // Add stack classes for duplicate visual effect
        if (group.count === 2) {
            wrapper.classList.add('has-duplicates', 'stack-2');
        } else if (group.count >= 3) {
            wrapper.classList.add('has-duplicates', 'stack-3');
        }

        const cardElement = createCardElement(group.card, false, onFocusClick);
        wrapper.appendChild(cardElement);

        // Store card data reference for shader initialization
        cardElement._cardData = group.card;

        // Add count badge if duplicates
        if (group.count > 1) {
            const countBadge = document.createElement('span');
            countBadge.className = 'card-count-badge';
            countBadge.textContent = `×${group.count}`;
            wrapper.appendChild(countBadge);
        }

        grid.appendChild(wrapper);
    });

    // Render pagination controls if more than one page (at top)
    if (totalPages > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination-controls';
        pagination.innerHTML = `
            <button class="pagination-btn" id="page-prev" ${collectionState.currentPage <= 1 ? 'disabled' : ''}>◀</button>
            <div class="pagination-info">
                <span class="pagination-page">Page ${collectionState.currentPage} of ${totalPages}</span>
                <span class="pagination-range">${startIdx + 1}-${endIdx} of ${sortedGroups.length}</span>
            </div>
            <button class="pagination-btn" id="page-next" ${collectionState.currentPage >= totalPages ? 'disabled' : ''}>▶</button>
        `;
        container.appendChild(pagination);

        // Bind pagination handlers
        document.getElementById('page-prev').addEventListener('click', () => {
            renderCollection(collectionState.currentPage - 1, onFocusClick);
        });
        document.getElementById('page-next').addEventListener('click', () => {
            renderCollection(collectionState.currentPage + 1, onFocusClick);
        });
    }

    container.appendChild(grid);

    // Initialize shaders for all visible cards after DOM is ready
    requestAnimationFrame(() => {
        initShadersForVisibleCards();
    });
}

/**
 * Initialize shaders for all visible cards in the collection
 * Uses pre-rendered texture cache (single WebGL context) instead of per-card contexts
 */
export function initShadersForVisibleCards() {
    const container = document.getElementById('collection-container');
    if (!container) return;

    const cards = container.querySelectorAll('.card');
    cards.forEach(cardElement => {
        if (cardElement._cardData) {
            applyShaderTexture(cardElement, cardElement._cardData);
        }
    });
}
