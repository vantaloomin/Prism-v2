/**
 * AETHEL SAGA - Core Shader Engine
 * WebGL2 rendering engine for card effects
 */

import { VERTEX_SHADER, FRAGMENT_SHADER } from './glsl-shaders.js';

// Reference to animationsEnabled from multi-instance module
// Will be set via setAnimationsEnabledRef
let animationsEnabledRef = { value: true };

/**
 * Set reference to animations enabled state
 * @param {Object} ref - Reference object with 'value' property
 */
export function setAnimationsEnabledRef(ref) {
    animationsEnabledRef = ref;
}

// ============================================
// SHADER ENGINE CLASS
// ============================================

export class ShaderEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            premultipliedAlpha: false,
            alpha: true,
            antialias: true
        });

        if (!this.gl) {
            console.error('WebGL2 not supported');
            this.isLost = true;
            return;
        }

        this.program = null;
        this.uniforms = {};
        this.startTime = Date.now();
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.frameType = 0;
        this.holoType = 0;
        this.animationId = null;
        this.isLost = false;

        // Handle WebGL context loss
        this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            this.isLost = true;
            this.stopAnimation();
            console.warn('WebGL context lost for card shader');
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            this.isLost = false;
            this.init();
            if (animationsEnabledRef.value) {
                this.startAnimation();
            }
            console.log('WebGL context restored for card shader');
        });

        this.init();
    }

    init() {
        const gl = this.gl;
        if (!gl) return;

        // Compile shaders
        const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

        if (!vertShader || !fragShader) return;

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertShader);
        gl.attachShader(this.program, fragShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program failed to link:', gl.getProgramInfoLog(this.program));
            return;
        }

        gl.useProgram(this.program);

        // Setup geometry (fullscreen quad)
        const positions = new Float32Array([
            -1, -1, 0, 1,
            1, -1, 1, 1,
            -1, 1, 0, 0,
            1, 1, 1, 0,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Setup attributes
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');

        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

        // Get uniform locations
        this.uniforms = {
            time: gl.getUniformLocation(this.program, 'u_time'),
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            frameType: gl.getUniformLocation(this.program, 'u_frameType'),
            holoType: gl.getUniformLocation(this.program, 'u_holoType')
        };

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    compileShader(type, source) {
        const gl = this.gl;
        if (!gl) return null;

        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setCardData(frameId, holoId) {
        const frameMap = { white: 0, blue: 1, red: 2, gold: 3, rainbow: 4, black: 5 };
        const holoMap = { none: 0, shiny: 1, rainbow: 2, pearl: 3, fractal: 4, void: 5 };

        this.frameType = frameMap[frameId] ?? 0;
        this.holoType = holoMap[holoId] ?? 0;
    }

    setMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    render() {
        const gl = this.gl;
        if (!gl || !this.program || this.isLost) return;

        // Check if context is actually lost
        if (gl.isContextLost()) {
            this.isLost = true;
            return;
        }

        const time = (Date.now() - this.startTime) / 1000.0;

        // Set uniforms
        gl.uniform1f(this.uniforms.time, time);
        gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        gl.uniform1i(this.uniforms.frameType, this.frameType);
        gl.uniform1i(this.uniforms.holoType, this.holoType);

        // Clear with full transparency and draw
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    startAnimation() {
        if (this.isLost) return;

        const animate = () => {
            if (this.isLost) return;
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stopAnimation();
        if (this.gl && this.program && !this.isLost) {
            this.gl.deleteProgram(this.program);
        }
    }
}
