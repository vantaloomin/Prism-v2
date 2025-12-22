/**
 * AETHEL SAGA - Shader Texture Cache
 * Pre-renders all frame/holo combinations for performance
 */

import { ShaderEngine } from './shader-engine-core.js';
import { areAnimationsEnabled, setShaderTextureCacheRef } from './shader-multi-instance.js';

// ============================================
// SHADER TEXTURE CACHE
// Pre-renders all frame/holo combos with single WebGL context
// ============================================

const FRAME_IDS = ['white', 'blue', 'red', 'gold', 'rainbow', 'black'];
const HOLO_IDS = ['none', 'shiny', 'rainbow', 'pearl', 'fractal', 'void'];

class ShaderTextureCache {
    constructor() {
        this.cache = new Map(); // Key: "frame_holo" -> canvas element
        this.engine = null;
        this.canvas = null;
        this.animationId = null;
        this.isInitialized = false;
        this.updateCallbacks = []; // Cards that need texture updates
    }

    /**
     * Initialize the cache with a single WebGL context
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     */
    init(width = 300, height = 450) {
        if (this.isInitialized) return;

        // Create hidden canvas for rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);

        // Create single shader engine
        this.engine = new ShaderEngine(this.canvas);

        // Pre-render all combinations
        this.renderAllCombos();

        // Start animation loop to update cache
        this.startAnimationLoop();

        this.isInitialized = true;
        console.log(`✦ Shader Texture Cache initialized (${FRAME_IDS.length * HOLO_IDS.length} combos) ✦`);
    }

    /**
     * Render all frame/holo combinations to cache
     */
    renderAllCombos() {
        for (const frameId of FRAME_IDS) {
            for (const holoId of HOLO_IDS) {
                this.renderCombo(frameId, holoId);
            }
        }
    }

    /**
     * Render a single combo to its cached canvas
     */
    renderCombo(frameId, holoId) {
        const key = `${frameId}_${holoId}`;

        // Create or get cached canvas for this combo
        let cachedCanvas = this.cache.get(key);
        if (!cachedCanvas) {
            cachedCanvas = document.createElement('canvas');
            cachedCanvas.width = this.canvas.width;
            cachedCanvas.height = this.canvas.height;
            this.cache.set(key, cachedCanvas);
        }

        // Render to main canvas
        this.engine.setCardData(frameId, holoId);
        this.engine.render();

        // Copy to cached canvas
        const ctx = cachedCanvas.getContext('2d');
        ctx.clearRect(0, 0, cachedCanvas.width, cachedCanvas.height);
        ctx.drawImage(this.canvas, 0, 0);
    }

    /**
     * Get cached canvas for a frame/holo combo
     * @param {string} frameId 
     * @param {string} holoId 
     * @returns {HTMLCanvasElement} The cached canvas
     */
    getTexture(frameId, holoId) {
        const key = `${frameId}_${holoId}`;
        return this.cache.get(key) || null;
    }

    /**
     * Start animation loop to update cached textures
     * Updates at ~15fps for smooth shimmer effects
     */
    startAnimationLoop() {
        if (!areAnimationsEnabled()) {
            // Just render once if animations disabled
            this.renderAllCombos();
            return;
        }

        let lastUpdate = 0;
        const targetFPS = 15;
        const frameInterval = 1000 / targetFPS;

        const animate = (timestamp) => {
            if (timestamp - lastUpdate >= frameInterval) {
                this.renderAllCombos();
                this.notifyUpdateCallbacks();
                lastUpdate = timestamp;
            }
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    /**
     * Stop animation loop
     */
    stopAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Register a callback to be notified when textures update
     * @param {Function} callback
     */
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    /**
     * Remove a callback
     * @param {Function} callback
     */
    offUpdate(callback) {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
            this.updateCallbacks.splice(index, 1);
        }
    }

    /**
     * Notify all registered callbacks that textures updated
     */
    notifyUpdateCallbacks() {
        for (const callback of this.updateCallbacks) {
            callback();
        }
    }

    /**
     * Toggle animation state
     * @param {boolean} enabled
     */
    setAnimationsEnabled(enabled) {
        if (enabled && !this.animationId) {
            this.startAnimationLoop();
        } else if (!enabled && this.animationId) {
            this.stopAnimationLoop();
            // Render one final frame
            this.renderAllCombos();
            this.notifyUpdateCallbacks();
        }
    }

    /**
     * Destroy the cache and release resources
     */
    destroy() {
        this.stopAnimationLoop();
        if (this.engine) {
            this.engine.destroy();
            this.engine = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.cache.clear();
        this.updateCallbacks = [];
        this.isInitialized = false;
    }
}

// Global texture cache instance
let shaderTextureCache = null;

/**
 * Get or create the global shader texture cache
 * @returns {ShaderTextureCache}
 */
function getShaderTextureCache() {
    if (!shaderTextureCache) {
        shaderTextureCache = new ShaderTextureCache();
        shaderTextureCache.init();
        // Register with multi-instance manager
        setShaderTextureCacheRef(shaderTextureCache);
    }
    return shaderTextureCache;
}

/**
 * Apply cached shader texture to a card element using canvas blitting
 * Uses drawImage() which is GPU-accelerated, much faster than toDataURL()
 * @param {HTMLElement} cardElement - The card DOM element
 * @param {Object} cardData - Card data with frame and holo info
 */
export function applyShaderTexture(cardElement, cardData) {
    const cache = getShaderTextureCache();
    const frameId = cardData.frame.id;
    const holoId = cardData.holo.id;

    // Find card front
    const cardFront = cardElement.querySelector('.card-front');
    if (!cardFront) return;

    // Create or find canvas overlay (not div with background-image)
    let canvas = cardFront.querySelector('.shader-texture-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'shader-texture-canvas';
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            border-radius: inherit;
            mix-blend-mode: screen;
        `;
        cardFront.appendChild(canvas);
    }

    // Set canvas size to match card
    const rect = cardElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');

    // Hide CSS holo layer (replaced by cached texture)
    const holoLayer = cardElement.querySelector('.card-layer-holo');
    if (holoLayer) holoLayer.style.display = 'none';

    // Function to blit (copy) the cached texture to this card's canvas
    const blitTexture = () => {
        const texture = cache.getTexture(frameId, holoId);
        if (texture && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
        }
    };

    // Initial blit
    blitTexture();

    // Register for animation updates
    cache.onUpdate(blitTexture);

    // Store cleanup function on element
    cardElement._shaderCleanup = () => {
        cache.offUpdate(blitTexture);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        if (holoLayer) holoLayer.style.display = '';
    };
}

/**
 * Remove cached shader texture from a card element
 * @param {HTMLElement} cardElement
 */
export function removeShaderTexture(cardElement) {
    if (cardElement._shaderCleanup) {
        cardElement._shaderCleanup();
        delete cardElement._shaderCleanup;
    }
}

// Export the cache class for testing
export { ShaderTextureCache };
