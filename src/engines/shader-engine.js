/**
 * AETHEL SAGA - WebGL Shader Engine
 * Barrel export - Re-exports all shader functionality from submodules
 * 
 * This file maintains backwards compatibility with existing imports.
 * All functionality is now modularized in the shaders/ subdirectory.
 */

// Re-export core engine
export { ShaderEngine } from './shaders/shader-engine-core.js';

// Re-export multi-instance management
export {
    areAnimationsEnabled,
    setAnimationsEnabled,
    initShaderCanvas,
    destroyShaderCanvasForCard,
    destroyShaderCanvas
} from './shaders/shader-multi-instance.js';

// Re-export texture caching
export {
    applyShaderTexture,
    removeShaderTexture
} from './shaders/shader-texture-cache.js';

console.log('✦ WebGL Shader Engine loaded (Modular) ✦');
