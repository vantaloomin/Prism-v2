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
    // Enhanced gloss varnish with subtle moving reflection (no mouse reactivity)
    vec2 center = vec2(0.5, 0.5);
    float highlight = pow(max(0.0, 1.0 - distance(uv, center) * 2.0), 4.0);
    
    // Subtle ambient light sweep (slowed down)
    float ambientSweep = sin(uv.x * 3.0 + uv.y * 2.0 - u_time * 0.2) * 0.5 + 0.5;
    ambientSweep = pow(ambientSweep, 4.0) * 0.1;
    
    // Very subtle noise texture for realism
    float glossNoise = snoise(uv * 30.0) * 0.02;
    
    float totalIntensity = highlight * 0.2 + ambientSweep + glossNoise;
    return vec4(1.0, 1.0, 1.0, totalIntensity);
}

vec4 holoShiny(vec2 uv) {
    // Enhanced classic foil with multiple sweep layers (slowed down, no mouse reactivity)
    
    // Primary diagonal sweep (slowed down)
    float sweep1 = sin((uv.x + uv.y) * 12.0 - u_time * 1.0);
    sweep1 = smoothstep(0.0, 0.15, sweep1) * smoothstep(0.3, 0.15, sweep1);
    
    // Secondary perpendicular sweep (slowed down)
    float sweep2 = sin((uv.x - uv.y) * 8.0 - u_time * 0.6);
    sweep2 = smoothstep(0.0, 0.2, sweep2) * smoothstep(0.4, 0.2, sweep2) * 0.5;
    
    // Combine sweeps
    float totalSweep = sweep1 + sweep2;
    
    // Add subtle sparkle noise (slowed down)
    float sparkle = pow(snoise(uv * 40.0 + u_time * 0.2) * 0.5 + 0.5, 8.0) * 0.3;
    
    // Static center-based boost (no mouse reactivity)
    vec2 center = vec2(0.5, 0.5);
    float centerDist = 1.0 - distance(uv, center);
    float centerBoost = pow(max(0.0, centerDist), 2.0);
    
    // Slight color tint based on position
    vec3 foilColor = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.95, 0.85), uv.y);
    
    float intensity = (totalSweep + sparkle) * (0.4 + centerBoost * 0.4);
    return vec4(foilColor, intensity);
}

vec4 holoRainbow(vec2 uv) {
    // Enhanced prismatic diffraction with waves and bands (slowed down, no mouse reactivity)
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = uv - center;
    float angle = atan(toCenter.y, toCenter.x);
    float dist = length(toCenter);
    
    // Primary rainbow from angle (slowed down)
    float hue1 = (angle / 6.28318 + 0.5) + u_time * 0.03;
    
    // Secondary rainbow bands based on distance (slowed down)
    float hue2 = fract(dist * 3.0 - u_time * 0.08);
    
    // Blend between angle and distance rainbows (slowed down)
    float blendFactor = sin(u_time * 0.2) * 0.3 + 0.5;
    float finalHue = mix(hue1, hue2, blendFactor * 0.4);
    
    vec3 rainbow = hsl2rgb(vec3(finalHue, 0.85, 0.55));
    
    // Add shimmer waves (slowed down)
    float shimmer = sin(dist * 20.0 - u_time * 1.2) * 0.5 + 0.5;
    shimmer = pow(shimmer, 2.0);
    rainbow += vec3(shimmer * 0.2);
    
    // Add noise texture (slowed down)
    float colorNoise = snoise(uv * 15.0 + u_time * 0.08) * 0.1;
    rainbow += vec3(colorNoise);
    
    float intensity = smoothstep(1.0, 0.0, dist) * 0.5 + shimmer * 0.15;
    return vec4(rainbow, intensity);
}

vec4 holoPearl(vec2 uv) {
    // Premium pearlescent with soap bubble, oil slick, and luster layers
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    
    // ============================================
    // LAYER 1: Soap Bubble Thin-Film Interference
    // Multiple frequency bands create rainbow shifts
    // ============================================
    float filmThickness = snoise(uv * 3.0 + u_time * 0.04) * 0.5 + 0.5;
    filmThickness += snoise(uv * 6.0 - u_time * 0.03) * 0.25;
    filmThickness += dist * 0.4; // Thickness varies with position
    
    // Multiple interference frequencies for rich color banding
    float band1 = sin(filmThickness * 18.0) * 0.5 + 0.5;
    float band2 = sin(filmThickness * 28.0 + 2.0) * 0.5 + 0.5;
    float band3 = sin(filmThickness * 42.0 + 4.0) * 0.5 + 0.5;
    
    // Soap bubble rainbow colors
    vec3 bubbleColor = vec3(0.0);
    bubbleColor += vec3(1.0, 0.4, 0.7) * band1;  // Magenta-pink
    bubbleColor += vec3(0.4, 0.9, 1.0) * band2;  // Cyan
    bubbleColor += vec3(0.6, 1.0, 0.5) * band3 * 0.6;  // Lime accent
    bubbleColor = mix(bubbleColor, vec3(1.0, 0.95, 0.98), 0.3); // Soften with white
    
    // ============================================
    // LAYER 2: Oil Slick Flowing Waves
    // Animated color flow across the surface
    // ============================================
    vec2 flowUV = uv;
    flowUV.x += sin(uv.y * 4.0 + u_time * 0.08) * 0.05;
    flowUV.y += cos(uv.x * 3.0 + u_time * 0.06) * 0.04;
    
    float oilFlow1 = snoise(flowUV * 5.0 + vec2(u_time * 0.05, 0.0));
    float oilFlow2 = snoise(flowUV * 7.0 - vec2(0.0, u_time * 0.04));
    float oilPattern = (oilFlow1 + oilFlow2) * 0.5 + 0.5;
    
    // Oil slick spectral colors
    float oilHue = fract(oilPattern * 0.8 + u_time * 0.02);
    vec3 oilColor = hsl2rgb(vec3(oilHue, 0.7, 0.55));
    
    // Add metallic sheen to oil
    float sheen = pow(oilPattern, 2.0) * 0.4;
    oilColor += vec3(sheen);
    
    // ============================================
    // LAYER 3: Depth Luster Layers
    // Stacked semi-transparent layers for richness
    // ============================================
    // Deep base layer
    vec3 deepLayer = vec3(0.9, 0.7, 0.85); // Warm pearl base
    float deepGlow = pow(1.0 - dist * 1.2, 2.0) * 0.5;
    deepLayer *= (0.8 + deepGlow);
    
    // Mid luster layer with gentle movement
    float midLuster = sin(uv.x * 8.0 + uv.y * 6.0 - u_time * 0.1) * 0.5 + 0.5;
    midLuster = pow(midLuster, 2.0);
    vec3 midLayer = mix(vec3(1.0, 0.85, 0.9), vec3(0.85, 0.95, 1.0), midLuster);
    
    // Top shimmer layer - bright highlights
    float topShimmer = sin(uv.x * 12.0 - uv.y * 8.0 + u_time * 0.15) * 0.5 + 0.5;
    topShimmer = pow(topShimmer, 4.0) * 0.6;
    vec3 topLayer = vec3(1.0, 0.98, 0.95) * topShimmer;
    
    // ============================================
    // COMBINE ALL LAYERS
    // ============================================
    // Start with deep luster base
    vec3 pearl = deepLayer * 0.4;
    
    // Add soap bubble interference
    pearl += bubbleColor * 0.35;
    
    // Blend in oil slick flow
    pearl = mix(pearl, oilColor, 0.25);
    
    // Add mid luster
    pearl += midLayer * 0.2;
    
    // Top shimmer highlights
    pearl += topLayer;
    
    // Edge enhancement - brighter at edges for "nacre" look
    float edgeFactor = 1.0 - pow(1.0 - dist * 1.3, 3.0);
    edgeFactor = clamp(edgeFactor, 0.0, 1.0);
    pearl += vec3(0.95, 0.9, 1.0) * edgeFactor * 0.15;
    
    // Soft center glow
    float centerGlow = pow(max(0.0, 1.0 - dist * 2.0), 3.0) * 0.2;
    pearl += vec3(1.0, 0.95, 0.98) * centerGlow;
    
    // Final intensity - richer overall presence
    float intensity = 0.45 + topShimmer * 0.15 + centerGlow * 0.1 + edgeFactor * 0.1;
    
    return vec4(pearl, intensity);
}

vec4 holoFractal(vec2 uv) {
    // Geometric crystal facets with animation and texture (slowed down)
    float scale = 8.0;
    vec2 cell = floor(uv * scale);
    vec2 local = fract(uv * scale);
    
    // Create sharp geometric lines
    float edge1 = abs(local.x - local.y);
    float edge2 = abs(local.x + local.y - 1.0);
    float edge3 = abs(local.x - 0.5);
    float edge4 = abs(local.y - 0.5);
    
    // Combine edges for faceted look
    float minEdge = min(min(edge1, edge2), min(edge3, edge4));
    float facetEdge = smoothstep(0.0, 0.08, minEdge);
    
    // Animated light sweep across facets (slowed down)
    float sweep = sin(uv.x * 5.0 + uv.y * 3.0 - u_time * 0.8) * 0.5 + 0.5;
    sweep = pow(sweep, 3.0); // Sharpen the sweep
    
    // Add noise texture for depth (slowed down)
    float noise = snoise(uv * 20.0 + u_time * 0.12) * 0.15;
    
    // Animated prismatic color - shifts over time with sweep influence (slowed down)
    float cellHue = fract((cell.x * 0.1 + cell.y * 0.15) + u_time * 0.04 + sweep * 0.2);
    vec3 prismColor = hsl2rgb(vec3(cellHue, 0.7, 0.5 + sweep * 0.2));
    
    // Add subtle color variation from noise
    prismColor += vec3(noise * 0.5, noise * 0.3, noise * 0.4);
    
    // Bright white edges with pulsing intensity (slowed down)
    float edgePulse = 0.7 + sin(u_time * 1.2 + (cell.x + cell.y) * 0.5) * 0.3;
    vec3 edgeGlow = vec3(1.0, 0.95, 0.9) * (1.0 - facetEdge) * edgePulse;
    
    // Light sweep highlight
    vec3 sweepGlow = vec3(1.0, 0.9, 0.8) * sweep * (1.0 - facetEdge) * 0.5;
    
    // Combine: prismatic fill + edge highlights + sweep + texture
    vec3 fractalColor = prismColor * facetEdge + edgeGlow + sweepGlow;
    
    float intensity = (1.0 - facetEdge) * 0.7 + sweep * 0.3 + 0.15;
    return vec4(fractalColor, intensity * 0.55);
}

vec4 holoVoid(vec2 uv) {
    // Vortex centered on card center (slowed down, no mouse reactivity)
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    
    // Angle from center - add subtle animation based on distance (slowed down)
    float angle = atan(toCenter.y, toCenter.x) + u_time * 0.12 + dist * 3.0;
    
    // Larger accretion disk that extends beyond edges
    float disk = sin(angle * 8.0) * 0.5 + 0.5;
    disk *= smoothstep(0.0, 0.15, dist) * smoothstep(1.2, 0.2, dist);
    
    // Swirling color mix
    vec3 voidColor = mix(
        vec3(0.3, 0.0, 0.5),  // Deep purple
        vec3(1.0, 0.3, 0.6),  // Hot pink
        disk
    );
    
    // Add cyan accent
    voidColor += vec3(0.0, 0.4, 0.5) * pow(disk, 2.0) * 0.5;
    
    // Dark core at center
    float darkness = smoothstep(0.15, 0.0, dist);
    voidColor *= (1.0 - darkness * 0.8);
    
    // Intensity extends to edges
    float intensity = disk * 0.7 + darkness * 0.4;
    intensity *= smoothstep(1.5, 0.0, dist); // Fade out far from center
    
    return vec4(voidColor, intensity);
}

// ============================================
// FRAME GLOW EFFECTS (Border enhancement)
// ============================================

vec4 getFrameGlow(vec2 uv, int frameType) {
    // Calculate distance to edge for border glow
    // uv is 0..1, so edgeDist is distance to nearest edge
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float borderGlow = smoothstep(0.12, 0.0, edgeDist);
    
    vec3 glowColor = vec3(1.0);
    float glowIntensity = 0.0;
    
    if (frameType == 0) {
        // White - Clean, no tint
        glowColor = vec3(1.0, 1.0, 1.0);
        glowIntensity = borderGlow * 0.3;
    }
    else if (frameType == 1) {
        // Blue - Soft glow at inner edges (no fire/shimmer)
        glowColor = vec3(0.4, 0.7, 1.0);
        glowIntensity = borderGlow * 0.6; // Steady, calm glow
    }
    else if (frameType == 2) {
        // Red - Fire effect (moved from Blue, toned down height)
        // Stronger vertical noise movement for fire (Upward flow = +time)
        float fire = snoise(uv * vec2(10.0, 20.0) + vec2(0.0, u_time * 2.0)) * 0.5 + 0.5;
        
        // Toned down height: use a sharper smoothstep (0.12 * 0.8 ~= 0.09)
        float sharpGlow = smoothstep(0.09, 0.0, edgeDist);
        
        glowColor = mix(vec3(1.0, 0.1, 0.0), vec3(1.0, 0.8, 0.2), fire);
        glowIntensity = sharpGlow * (0.6 + fire * 0.4);
    }
    else if (frameType == 3) {
        // Gold - Soft pulse added
        float shimmer = sin(uv.x * 30.0 + u_time * 2.0) * 0.5 + 0.5;
        float pulse = sin(u_time * 2.0) * 0.15 + 0.85; // Soft 15% pulse
        
        glowColor = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.95, 0.6), shimmer);
        glowIntensity = borderGlow * 0.5 * pulse;
    }
    else if (frameType == 4) {
        // Rainbow - Missing actual card border
        float hue = uv.x + uv.y + u_time * 0.3;
        glowColor = hsl2rgb(vec3(hue, 0.9, 0.6));
        
        // Add a hard inner border line (~3px equivalent)
        float borderLine = step(edgeDist, 0.015); 
        
        // Combine soft glow with hard border
        // Border line is solid opacity, glow is fading
        glowIntensity = max(borderGlow * 0.5, borderLine * 0.9);
    }
    else if (frameType == 5) {
        // Black - Thicker border
        // Increase smoothstep range for thickness
        float thickGlow = smoothstep(0.18, 0.0, edgeDist);
        
        float pulse = sin(u_time * 1.5 + uv.y * 5.0) * 0.5 + 0.5;
        glowColor = mix(vec3(0.1, 0.0, 0.2), vec3(0.3, 0.0, 0.5), pulse);
        glowIntensity = thickGlow * 0.7;
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
 * @param {HTMLElement} cardElement - The card DOM element
 * @param {Object} cardData - Card data with frame and holo info
 * @param {boolean} focusMode - If true, enable mouse tracking (for Focus view only)
 */
function initShaderCanvas(cardElement, cardData, focusMode = false) {
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
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            border-radius: inherit;
            mix-blend-mode: screen;
            transform-origin: top left;
        `;
        cardElement.appendChild(canvas);
    }

    // Hide CSS holo and frame tint layers (we're replacing them with WebGL)
    // Hide CSS holo layers (replaced by WebGL)
    const holoLayer = cardElement.querySelector('.card-layer-holo');
    const frameTint = cardElement.querySelector('.card-bg-tint');

    if (holoLayer) holoLayer.style.display = 'none';

    // For Black frame, we keep the tint (shadow effect), otherwise hide it
    // cardData.frame.id is 'black'
    if (frameTint) {
        if (cardData.frame.id !== 'black') {
            frameTint.style.display = 'none';
        } else {
            frameTint.style.display = ''; // Ensure it's visible for black
        }
    }

    // Set canvas size for crisp rendering
    const rect = cardElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);

    // Create engine
    activeShaderEngine = new ShaderEngine(canvas);
    activeShaderEngine.setCardData(cardData.frame.id, cardData.holo.id);
    activeShaderEngine.startAnimation();

    // Only enable mouse tracking in Focus Mode
    if (focusMode) {
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
    }
    // In non-focus mode, mouse stays centered (0.5, 0.5)

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

    // Restore CSS holo layers and remove shader canvases
    document.querySelectorAll('.shader-canvas').forEach(el => {
        // Find parent card and restore its CSS layers
        const card = el.closest('.card');
        if (card) {
            const holoLayer = card.querySelector('.card-layer-holo');
            const frameTint = card.querySelector('.card-bg-tint');
            if (holoLayer) holoLayer.style.display = '';
            if (frameTint) frameTint.style.display = '';
        }
        el.remove();
    });
}

console.log('✦ WebGL Shader Engine loaded (Overlay Mode) ✦');
