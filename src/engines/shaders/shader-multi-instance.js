/**
 * AETHEL SAGA - Shader Multi-Instance Manager
 * Integration helpers for collection view and focus mode
 */

import { ShaderEngine, setAnimationsEnabledRef } from './shader-engine-core.js';

// ============================================
// INTEGRATION HELPERS
// Multi-instance support for collection view
// ============================================

let activeShaderEngines = new Map(); // Map<cardElement, ShaderEngine>
let animationsEnabled = true;

// Create reference object for ShaderEngine to access
const animationsEnabledRef = { value: true };
setAnimationsEnabledRef(animationsEnabledRef);

// Reference to shader texture cache (will be set by texture-cache module)
let shaderTextureCache = null;

/**
 * Set reference to shader texture cache
 * @param {Object} cache - ShaderTextureCache instance
 */
export function setShaderTextureCacheRef(cache) {
    shaderTextureCache = cache;
}

/**
 * Check if animations are enabled
 */
export function areAnimationsEnabled() {
    return animationsEnabled;
}

/**
 * Set animations enabled/disabled globally
 * @param {boolean} enabled
 */
export function setAnimationsEnabled(enabled) {
    animationsEnabled = enabled;
    animationsEnabledRef.value = enabled;

    // Toggle body class for CSS animations
    document.body.classList.toggle('animations-paused', !enabled);

    // Control the shader texture cache animation loop
    if (shaderTextureCache) {
        shaderTextureCache.setAnimationsEnabled(enabled);
    }

    // Start/stop all active shader engines (Focus mode)
    activeShaderEngines.forEach((engine) => {
        if (enabled) {
            engine.startAnimation();
        } else {
            // Render one frame then stop
            engine.render();
            engine.stopAnimation();
        }
    });
}

/**
 * Initialize shader canvas for a card element
 * @param {HTMLElement} cardElement - The card DOM element
 * @param {Object} cardData - Card data with frame and holo info
 * @param {boolean} focusMode - If true, enable mouse tracking (for Focus view only)
 * @returns {ShaderEngine} The created shader engine
 */
export function initShaderCanvas(cardElement, cardData, focusMode = false) {
    // Check if already has a shader
    if (activeShaderEngines.has(cardElement)) {
        return activeShaderEngines.get(cardElement);
    }

    // Find or create canvas - append to card-front to share stacking context
    const cardFront = cardElement.querySelector('.card-front');
    if (!cardFront) {
        console.warn('No .card-front found for shader canvas');
        return null;
    }

    let canvas = cardFront.querySelector('.shader-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'shader-canvas';
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
            transform-origin: top left;
        `;
        cardFront.appendChild(canvas);
    }

    // Hide CSS holo layers (replaced by WebGL)
    const holoLayer = cardElement.querySelector('.card-layer-holo');
    const frameTint = cardElement.querySelector('.card-bg-tint');

    if (holoLayer) holoLayer.style.display = 'none';

    // For Black frame, keep the tint (shadow effect)
    if (frameTint) {
        if (cardData.frame.id !== 'black') {
            frameTint.style.display = 'none';
        } else {
            frameTint.style.display = '';
        }
    }

    // Set canvas size for crisp rendering
    const rect = cardElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);

    // Create engine
    const engine = new ShaderEngine(canvas);
    engine.setCardData(cardData.frame.id, cardData.holo.id);

    // Start or just render once based on animation state
    if (animationsEnabled) {
        engine.startAnimation();
    } else {
        engine.render();
    }

    // Store reference
    activeShaderEngines.set(cardElement, engine);

    // Only enable mouse tracking in Focus Mode
    if (focusMode) {
        const handleMouseMove = (e) => {
            const rect = cardElement.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            engine.setMouse(x, y);
        };

        const handleMouseLeave = () => {
            engine.setMouse(0.5, 0.5);
        };

        cardElement.addEventListener('mousemove', handleMouseMove);
        cardElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return engine;
}

/**
 * Destroy shader canvas for a specific card element
 * @param {HTMLElement} cardElement
 */
export function destroyShaderCanvasForCard(cardElement) {
    const engine = activeShaderEngines.get(cardElement);
    if (engine) {
        engine.destroy();
        activeShaderEngines.delete(cardElement);
    }

    const canvas = cardElement.querySelector('.shader-canvas');
    if (canvas) {
        canvas.remove();
    }

    // Restore CSS layers
    const holoLayer = cardElement.querySelector('.card-layer-holo');
    const frameTint = cardElement.querySelector('.card-bg-tint');
    if (holoLayer) holoLayer.style.display = '';
    if (frameTint) frameTint.style.display = '';
}

/**
 * Destroy all active shader engines
 */
export function destroyShaderCanvas() {
    activeShaderEngines.forEach((engine, cardElement) => {
        engine.destroy();
        const canvas = cardElement.querySelector('.shader-canvas');
        if (canvas) canvas.remove();

        // Restore CSS layers
        const holoLayer = cardElement.querySelector('.card-layer-holo');
        const frameTint = cardElement.querySelector('.card-bg-tint');
        if (holoLayer) holoLayer.style.display = '';
        if (frameTint) frameTint.style.display = '';
    });
    activeShaderEngines.clear();
}

// Re-export ShaderEngine for convenience
export { ShaderEngine };
