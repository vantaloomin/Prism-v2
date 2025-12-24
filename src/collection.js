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
import {
    calculateScrapValue,
    scrapFromGroup,
    getMaxScrappable
} from './engines/scrap-logic.js';

// ============================================
// SCRAP MODAL STATE
// ============================================

let currentScrapGroup = null;
let currentScrapQuantity = 1;
let currentOnFocusClick = null;

// ============================================
// COLLECTION RENDERING
// ============================================

/**
 * Render the collection view with sorted, grouped cards
 * @param {number|null} page - Page number (null = current page)
 * @param {Function} onFocusClick - Callback for focus mode
 */
export function renderCollection(page = null, onFocusClick = null) {
    // Store onFocusClick reference for re-render after scrapping
    currentOnFocusClick = onFocusClick;

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
                count: 0,
                groupKey: key
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

            // Add scrap button for duplicates
            const scrapValue = calculateScrapValue(group.card);
            const scrapBtn = document.createElement('button');
            scrapBtn.className = 'scrap-btn';
            scrapBtn.innerHTML = `<img src="assets/ui/icon-currency.webp" alt="gems"> ${scrapValue}`;
            scrapBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openScrapModal(group);
            });
            wrapper.appendChild(scrapBtn);
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

    // Update Convert All button state
    updateConvertAllButton();
}

// ============================================
// SCRAP MODAL HANDLING
// ============================================

/**
 * Open the scrap confirmation modal for a card group
 * @param {Object} group - The card group { card, count, groupKey }
 */
function openScrapModal(group) {
    currentScrapGroup = group;
    currentScrapQuantity = 1;

    const overlay = document.getElementById('scrap-overlay');
    const cardName = document.getElementById('scrap-card-name');
    const cardDetails = document.getElementById('scrap-card-details');
    const gemsValue = document.getElementById('scrap-gems-value');
    const qtyValue = document.getElementById('scrap-qty-value');
    const qtyMax = document.getElementById('scrap-qty-max');
    const qtySection = document.getElementById('scrap-quantity-section');
    const minusBtn = document.getElementById('scrap-qty-minus');
    const plusBtn = document.getElementById('scrap-qty-plus');

    if (!overlay) return;

    // Populate card info
    const card = group.card;
    cardName.textContent = card.name;
    cardDetails.textContent = `${card.rarity.name} • ${card.frame.name} Frame • ${card.holo.name === 'None' ? 'No Holo' : card.holo.name + ' Holo'}`;

    // Calculate max scrappable (keep at least one)
    const maxScrappable = group.count - 1;

    // Show/hide quantity section based on max
    if (maxScrappable <= 1) {
        qtySection.style.display = 'none';
    } else {
        qtySection.style.display = 'flex';
        qtyMax.textContent = `(max: ${maxScrappable})`;
    }

    // Update display
    updateScrapDisplay();

    // Show modal
    overlay.classList.add('active');

    // Wire up quantity controls
    minusBtn.onclick = () => {
        if (currentScrapQuantity > 1) {
            currentScrapQuantity--;
            updateScrapDisplay();
        }
    };

    plusBtn.onclick = () => {
        if (currentScrapQuantity < maxScrappable) {
            currentScrapQuantity++;
            updateScrapDisplay();
        }
    };

    // Wire up action buttons (using clone-replace pattern to avoid listener accumulation)
    const cancelBtn = document.getElementById('scrap-cancel');
    const confirmBtn = document.getElementById('scrap-confirm');

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', closeScrapModal);

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', confirmScrap);
}

/**
 * Update the scrap modal display (gems value, quantity, button states)
 */
function updateScrapDisplay() {
    if (!currentScrapGroup) return;

    const gemsValue = document.getElementById('scrap-gems-value');
    const qtyValue = document.getElementById('scrap-qty-value');
    const minusBtn = document.getElementById('scrap-qty-minus');
    const plusBtn = document.getElementById('scrap-qty-plus');

    const singleValue = calculateScrapValue(currentScrapGroup.card);
    const totalValue = singleValue * currentScrapQuantity;
    const maxScrappable = currentScrapGroup.count - 1;

    gemsValue.textContent = totalValue;
    qtyValue.textContent = currentScrapQuantity;

    // Update button states
    minusBtn.disabled = currentScrapQuantity <= 1;
    plusBtn.disabled = currentScrapQuantity >= maxScrappable;
}

/**
 * Close the scrap modal
 */
function closeScrapModal() {
    const overlay = document.getElementById('scrap-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    currentScrapGroup = null;
    currentScrapQuantity = 1;
}

/**
 * Confirm the scrap action
 */
function confirmScrap() {
    if (!currentScrapGroup) return;

    const result = scrapFromGroup(currentScrapGroup.groupKey, currentScrapQuantity);

    console.log(`♻️ Scrapped ${result.count} cards for ${result.totalValue} gems`);

    // Close modal
    closeScrapModal();

    // Re-render collection
    renderCollection(null, currentOnFocusClick);
}

/**
 * Initialize scrap modal event listeners (call once on init)
 */
export function initScrapModal() {
    const overlay = document.getElementById('scrap-overlay');
    if (!overlay) return;

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeScrapModal();
        }
    });

    // Initialize Convert All modal
    initConvertAllModal();
}

// ============================================
// CONVERT ALL DUPLICATES
// ============================================

/**
 * Calculate total duplicates and their combined scrap value
 * @returns {Object} { totalDuplicates, totalValue, groups }
 */
function calculateAllDuplicates() {
    // Group cards by unique combo
    const cardGroups = {};
    gameState.inventory.forEach(card => {
        const key = getCardGroupKey(card);
        if (!cardGroups[key]) {
            cardGroups[key] = {
                card: card,
                count: 0,
                groupKey: key
            };
        }
        cardGroups[key].count++;
    });

    let totalDuplicates = 0;
    let totalValue = 0;
    const groups = [];

    Object.values(cardGroups).forEach(group => {
        if (group.count > 1) {
            const dupeCount = group.count - 1; // Keep one of each
            const cardValue = calculateScrapValue(group.card);
            totalDuplicates += dupeCount;
            totalValue += cardValue * dupeCount;
            groups.push({
                ...group,
                dupeCount,
                value: cardValue * dupeCount
            });
        }
    });

    return { totalDuplicates, totalValue, groups };
}

/**
 * Update the Convert All button state (disabled if no duplicates)
 */
export function updateConvertAllButton() {
    const btn = document.getElementById('convert-all-btn');
    if (!btn) return;

    const { totalDuplicates } = calculateAllDuplicates();
    btn.disabled = totalDuplicates === 0;
}

/**
 * Open the Convert All confirmation modal
 */
function openConvertAllModal() {
    const { totalDuplicates, totalValue } = calculateAllDuplicates();

    if (totalDuplicates === 0) {
        console.log('No duplicates to convert');
        return;
    }

    const overlay = document.getElementById('convert-all-overlay');
    const countEl = document.getElementById('convert-all-count');
    const gemsEl = document.getElementById('convert-all-gems');

    if (!overlay) return;

    countEl.textContent = totalDuplicates;
    gemsEl.textContent = totalValue;

    overlay.classList.add('active');
}

/**
 * Close the Convert All modal
 */
function closeConvertAllModal() {
    const overlay = document.getElementById('convert-all-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Confirm and execute Convert All
 */
function confirmConvertAll() {
    const { groups } = calculateAllDuplicates();

    let totalScrapped = 0;
    let totalGems = 0;

    // Scrap duplicates from each group
    groups.forEach(group => {
        const result = scrapFromGroup(group.groupKey, group.dupeCount);
        totalScrapped += result.count;
        totalGems += result.totalValue;
    });

    console.log(`♻️ Converted all: ${totalScrapped} duplicates for ${totalGems} gems`);

    // Close modal
    closeConvertAllModal();

    // Re-render collection
    renderCollection(null, currentOnFocusClick);
}

/**
 * Initialize Convert All modal event listeners
 */
function initConvertAllModal() {
    const overlay = document.getElementById('convert-all-overlay');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const cancelBtn = document.getElementById('convert-all-cancel');
    const confirmBtn = document.getElementById('convert-all-confirm');

    if (!overlay) return;

    // Convert All button in header
    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', openConvertAllModal);
    }

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeConvertAllModal();
        }
    });

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeConvertAllModal);
    }

    // Confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmConvertAll);
    }
}

// ============================================
// SHADER INITIALIZATION
// ============================================

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

// ============================================
// SCROLL TO TOP BUTTON
// ============================================

/**
 * Initialize the scroll-to-top button functionality
 * Shows button when scrolled past threshold, hides when at top
 */
export function initScrollToTop() {
    const collectionTab = document.getElementById('tab-content-collection');
    const scrollBtn = document.getElementById('scroll-to-top-btn');

    if (!collectionTab || !scrollBtn) return;

    const SCROLL_THRESHOLD = 200;

    // Listen for scroll on the collection tab (it has overflow-y: auto)
    collectionTab.addEventListener('scroll', () => {
        if (collectionTab.scrollTop > SCROLL_THRESHOLD) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    // Handle click - smooth scroll to top
    scrollBtn.addEventListener('click', () => {
        collectionTab.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

