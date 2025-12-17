/* ============================================
   PROJECT PRISM - WebGL SHADER ENGINE
   Transparent overlay effects for cards
   ============================================ */

// ============================================
// VERTEX SHADER (Simple passthrough)
// ============================================
const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

// ============================================
// FRAGMENT SHADER - TRANSPARENT OVERLAY
// Only outputs glow/shimmer effects with alpha
// ============================================
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform int u_frameType;
uniform int u_holoType;

// ============================================
// NOISE FUNCTIONS
// ============================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    float m = 8.0;
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            o = 0.5 + 0.5 * sin(u_time * 0.5 + 6.2831 * o);
            vec2 r = g + o - f;
            float d = dot(r, r);
            m = min(m, d);
        }
    }
    return sqrt(m);
}

// HSL to RGB
vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

// ============================================
// HOLO EFFECTS (Return color + alpha)
// ============================================

vec4 holoNone(vec2 uv) {
    // Subtle gloss highlight following mouse
    float highlight = pow(max(0.0, 1.0 - distance(uv, u_mouse) * 2.0), 4.0);
    return vec4(1.0, 1.0, 1.0, highlight * 0.15);
}

vec4 holoShiny(vec2 uv) {
    // Classic diagonal sweep
    float sweep = sin((uv.x + uv.y) * 15.0 - u_time * 3.0);
    sweep = smoothstep(0.0, 0.1, sweep) * smoothstep(0.2, 0.1, sweep);
    
    // Follow mouse
    float mouseDist = 1.0 - distance(uv, u_mouse);
    sweep *= pow(max(0.0, mouseDist), 2.0) * 2.0;
    
    return vec4(1.0, 1.0, 1.0, sweep * 0.5);
}

vec4 holoRainbow(vec2 uv) {
    // Prismatic diffraction based on angle from mouse
    vec2 toMouse = uv - u_mouse;
    float angle = atan(toMouse.y, toMouse.x);
    float dist = length(toMouse);
    
    float hue = (angle / 6.28318 + 0.5) + u_time * 0.1;
    vec3 rainbow = hsl2rgb(vec3(hue, 0.9, 0.6));
    
    float intensity = smoothstep(0.8, 0.0, dist) * 0.4;
    
    return vec4(rainbow, intensity);
}

vec4 holoPearl(vec2 uv) {
    // Iridescent shimmer
    float thickness = snoise(uv * 5.0 + u_time * 0.2) * 0.5 + 0.5;
    thickness += distance(uv, u_mouse) * 0.5;
    
    float interference = sin(thickness * 20.0) * 0.5 + 0.5;
    
    vec3 pearl = mix(
        vec3(1.0, 0.7, 0.85),
        vec3(0.7, 0.9, 1.0),
        interference
    );
    
    float intensity = 0.35;
    return vec4(pearl, intensity);
}

vec4 holoFractal(vec2 uv) {
    // Crystal facets
    float vor = voronoi(uv * 10.0);
    float edges = 1.0 - smoothstep(0.0, 0.15, vor);
    
    // Rainbow through crystals
    float hue = vor + u_time * 0.1;
    vec3 crystal = hsl2rgb(vec3(hue, 0.7, 0.6));
    
    float sparkle = pow(1.0 - vor, 12.0);
    crystal += vec3(sparkle) * 0.8;
    
    float intensity = edges * 0.6 + sparkle * 0.4;
    return vec4(crystal, intensity * 0.5);
}

vec4 holoVoid(vec2 uv) {
    // Swirling dark vortex with purple glow
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x) + u_time;
    
    // Accretion disk
    float disk = sin(angle * 6.0) * 0.5 + 0.5;
    disk *= smoothstep(0.1, 0.25, dist) * smoothstep(0.5, 0.3, dist);
    
    vec3 voidColor = mix(
        vec3(0.4, 0.0, 0.6),
        vec3(0.8, 0.2, 0.5),
        disk
    );
    
    // Dark center
    float darkness = smoothstep(0.2, 0.0, dist);
    voidColor *= (1.0 - darkness * 0.5);
    
    float intensity = disk * 0.6 + darkness * 0.3;
    return vec4(voidColor, intensity);
}

// ============================================
// FRAME GLOW EFFECTS (Border enhancement)
// ============================================

vec4 getFrameGlow(vec2 uv, int frameType) {
    // Calculate distance to edge for border glow
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float borderGlow = smoothstep(0.12, 0.0, edgeDist);
    
    vec3 glowColor = vec3(1.0);
    float glowIntensity = 0.0;
    
    if (frameType == 0) {
        // White - subtle clean glow
        glowColor = vec3(1.0, 1.0, 1.0);
        glowIntensity = borderGlow * 0.2;
    }
    else if (frameType == 1) {
        // Blue - icy shimmer
        float shimmer = snoise(uv * 20.0 + u_time) * 0.5 + 0.5;
        glowColor = vec3(0.4, 0.7, 1.0);
        glowIntensity = borderGlow * (0.4 + shimmer * 0.3);
    }
    else if (frameType == 2) {
        // Red - pulsing magma
        float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
        float flow = snoise(uv * 8.0 - vec2(0.0, u_time * 0.5)) * 0.5 + 0.5;
        glowColor = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.6, 0.0), flow);
        glowIntensity = borderGlow * pulse * 0.6;
    }
    else if (frameType == 3) {
        // Gold - luxurious shimmer
        float shimmer = sin(uv.x * 30.0 + u_time * 2.0) * 0.5 + 0.5;
        glowColor = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.95, 0.6), shimmer);
        glowIntensity = borderGlow * 0.5;
    }
    else if (frameType == 4) {
        // Rainbow - cycling colors
        float hue = uv.x + uv.y + u_time * 0.3;
        glowColor = hsl2rgb(vec3(hue, 0.9, 0.5));
        glowIntensity = borderGlow * 0.6;
    }
    else if (frameType == 5) {
        // Black - void edge with purple accents
        float pulse = sin(u_time * 2.0 + uv.y * 10.0) * 0.5 + 0.5;
        glowColor = vec3(0.3, 0.0, 0.5) * pulse;
        glowIntensity = borderGlow * 0.4;
    }
    
    return vec4(glowColor, glowIntensity);
}

// ============================================
// MAIN
// ============================================

void main() {
    vec2 uv = v_texCoord;
    
    // Start fully transparent
    vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
    
    // Add frame border glow
    vec4 frameGlow = getFrameGlow(uv, u_frameType);
    result.rgb += frameGlow.rgb * frameGlow.a;
    result.a = max(result.a, frameGlow.a);
    
    // Add holo effect
    vec4 holoEffect = vec4(0.0);
    if (u_holoType == 0) holoEffect = holoNone(uv);
    else if (u_holoType == 1) holoEffect = holoShiny(uv);
    else if (u_holoType == 2) holoEffect = holoRainbow(uv);
    else if (u_holoType == 3) holoEffect = holoPearl(uv);
    else if (u_holoType == 4) holoEffect = holoFractal(uv);
    else if (u_holoType == 5) holoEffect = holoVoid(uv);
    
    // Blend holo on top (additive-ish)
    result.rgb += holoEffect.rgb * holoEffect.a;
    result.a = max(result.a, holoEffect.a);
    
    fragColor = result;
}
`;

// ============================================
// SHADER ENGINE CLASS
// ============================================

class ShaderEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            premultipliedAlpha: false,
            alpha: true,
            antialias: true
        });

        if (!this.gl) {
            console.error('WebGL2 not supported');
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

        this.init();
    }

    init() {
        const gl = this.gl;

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
        if (!gl || !this.program) return;

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
        const animate = () => {
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
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
    }
}

// ============================================
// INTEGRATION HELPERS
// ============================================

let activeShaderEngine = null;

/**
 * Initialize shader canvas for a card element
 */
function initShaderCanvas(cardElement, cardData) {
    // Clean up existing
    if (activeShaderEngine) {
        activeShaderEngine.destroy();
        activeShaderEngine = null;
    }

    // Find or create canvas
    let canvas = cardElement.querySelector('.shader-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'shader-canvas';
        canvas.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            border-radius: inherit;
            mix-blend-mode: screen;
        `;
        cardElement.appendChild(canvas);
    }

    // Set canvas size for crisp rendering
    const rect = cardElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);

    // Create engine
    activeShaderEngine = new ShaderEngine(canvas);
    activeShaderEngine.setCardData(cardData.frame.id, cardData.holo.id);
    activeShaderEngine.startAnimation();

    // Mouse tracking
    const handleMouseMove = (e) => {
        if (!activeShaderEngine) return;
        const rect = cardElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        activeShaderEngine.setMouse(x, y);
    };

    const handleMouseLeave = () => {
        if (activeShaderEngine) {
            activeShaderEngine.setMouse(0.5, 0.5);
        }
    };

    cardElement.addEventListener('mousemove', handleMouseMove);
    cardElement.addEventListener('mouseleave', handleMouseLeave);

    return activeShaderEngine;
}

/**
 * Destroy active shader engine
 */
function destroyShaderCanvas() {
    if (activeShaderEngine) {
        activeShaderEngine.destroy();
        activeShaderEngine = null;
    }

    // Also remove any shader canvas elements
    document.querySelectorAll('.shader-canvas').forEach(el => el.remove());
}

console.log('✦ WebGL Shader Engine loaded (Overlay Mode) ✦');
