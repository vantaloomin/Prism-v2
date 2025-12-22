/**
 * AETHEL SAGA - GLSL Shader Source Code
 * Contains vertex and fragment shader strings for WebGL rendering
 */

// ============================================
// VERTEX SHADER (Simple passthrough)
// ============================================
export const VERTEX_SHADER = `#version 300 es
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
export const FRAGMENT_SHADER = `#version 300 es
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
    // Enhanced classic foil with multiple sweep layers
    // Slowed down 20% more, lowered brightness 10%
    
    // Primary diagonal sweep (slowed 20%: 0.8 -> 0.64)
    float sweep1 = sin((uv.x + uv.y) * 12.0 - u_time * 0.64);
    sweep1 = smoothstep(0.0, 0.15, sweep1) * smoothstep(0.3, 0.15, sweep1);
    
    // Secondary perpendicular sweep (slowed 20%: 0.48 -> 0.384)
    float sweep2 = sin((uv.x - uv.y) * 8.0 - u_time * 0.384);
    sweep2 = smoothstep(0.0, 0.2, sweep2) * smoothstep(0.4, 0.2, sweep2) * 0.5;
    
    // Vertical sweep for added movement (slowed 20%: 0.6 -> 0.48)
    float vertSweep = sin(uv.y * 15.0 - u_time * 0.48) * 0.5 + 0.5;
    vertSweep = pow(vertSweep, 3.0) * 0.3;
    
    // Combine sweeps
    float totalSweep = sweep1 + sweep2 + vertSweep;
    
    // Add subtle sparkle noise (slowed 20%: 0.16 -> 0.128)
    float sparkle = pow(snoise(uv * 40.0 + u_time * 0.128) * 0.5 + 0.5, 8.0) * 0.25;
    
    // Static center-based boost (no mouse reactivity)
    vec2 center = vec2(0.5, 0.5);
    float centerDist = 1.0 - distance(uv, center);
    float centerBoost = pow(max(0.0, centerDist), 2.0);
    
    // Slight color tint based on position
    vec3 foilColor = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.95, 0.85), uv.y);
    
    // Reduced opacity by 10%: 1.17 -> 1.053
    float intensity = (totalSweep + sparkle) * (0.55 + centerBoost * 0.45);
    return vec4(foilColor, intensity * 1.053);
}

vec4 holoRainbow(vec2 uv) {
    // Smoother, cleaner rainbow gradient
    // Removed sharp radial bands and fract discontinuities
    
    // Base gradient flow - diagonal movement
    float baseHue = uv.x * 0.4 + uv.y * 0.3 + u_time * 0.05;
    
    // Large slow noise to warp the colors organically
    float warp = snoise(uv * 2.5 + u_time * 0.05) * 0.2;
    
    // Combine for final hue
    float finalHue = fract(baseHue + warp);
    
    // Use slightly less saturated colors for a smoother look
    vec3 rainbow = hsl2rgb(vec3(finalHue, 0.8, 0.6));
    
    // Add soft, large-scale shimmer waves (sine based, no pow)
    float wave = sin((uv.x + uv.y) * 4.0 - u_time * 0.8) * 0.5 + 0.5;
    
    // Add subtle sparkle noise
    float sparkle = snoise(uv * 20.0 + u_time * 0.1) * 0.1;
    
    // Combine effects
    // Screen blend the wave to keep it light
    rainbow += vec3(wave * 0.15);
    rainbow += vec3(sparkle);
    
    // Smooth intensity gradient - no sharp cutoffs
    float intensity = 0.5 + wave * 0.2 + sparkle;
    
    return vec4(rainbow, intensity * 0.9);
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
    
    // Final intensity - reduced opacity by 10%: 1.2 -> 1.08
    float intensity = 0.50 + topShimmer * 0.18 + centerGlow * 0.12 + edgeFactor * 0.12;
    
    return vec4(pearl, intensity * 1.08);
}

vec4 holoFractal(vec2 uv) {
    // Sacred Geometry Mandala with Crystalline Refraction
    // Multi-layer rotating geometric patterns with prismatic light bursts
    // Anchor point: upper-right corner, light sweeps across card
    
    vec2 center = vec2(1.0, 0.0);  // Upper-right anchor
    vec2 delta = uv - center;
    float dist = length(delta);
    float angle = atan(delta.y, delta.x);
    
    // Scale factor to make patterns cover full card from corner
    float scaledDist = dist * 0.7;  // Larger patterns
    
    // ============================================
    // LAYER 1: Rotating Sacred Geometry Mandala
    // Concentric rings of geometric patterns - SCALED UP
    // ============================================
    
    // Outer ring - hexagonal pattern (Flower of Life inspired)
    float outerRot = angle + u_time * 0.15;
    float hexPattern = abs(sin(outerRot * 3.0)) * 0.5 + 0.5;
    hexPattern *= smoothstep(1.2, 0.9, scaledDist) * smoothstep(0.5, 0.7, scaledDist);
    
    // Middle ring - triangular geometry (counter-rotating)
    float midRot = angle - u_time * 0.1;
    float triPattern = abs(sin(midRot * 6.0)) * 0.5 + 0.5;
    triPattern *= smoothstep(0.9, 0.6, scaledDist) * smoothstep(0.25, 0.45, scaledDist);
    
    // Inner ring - star burst pattern
    float innerRot = angle + u_time * 0.2;
    float starPattern = pow(abs(sin(innerRot * 8.0)), 3.0);
    starPattern *= smoothstep(0.5, 0.25, scaledDist) * smoothstep(0.0, 0.15, scaledDist);
    
    // Combine geometry layers
    float geometry = hexPattern * 0.5 + triPattern * 0.7 + starPattern;
    
    // ============================================
    // LAYER 2: Radial Line Work (Metatron's Cube style)
    // Sharp lines emanating from anchor point
    // ============================================
    float lineAngle = mod(angle + 3.14159, 3.14159 / 6.0);
    float radialLines = smoothstep(0.08, 0.0, lineAngle) + smoothstep(0.08, 0.0, 3.14159/6.0 - lineAngle);
    radialLines *= (1.0 - smoothstep(0.0, 0.3, scaledDist)); // Fade near center
    radialLines *= smoothstep(1.4, 0.8, scaledDist); // Fade at far edges
    
    // Pulsing line intensity
    float linePulse = sin(u_time * 1.5 + scaledDist * 8.0) * 0.3 + 0.7;
    radialLines *= linePulse;
    
    // ============================================
    // LAYER 3: Crystalline Refraction Bursts
    // Bright prismatic light hitting facet edges
    // ============================================
    
    // Facet grid (diamond pattern)
    vec2 facetUV = uv * 12.0;
    vec2 facetCell = floor(facetUV);
    vec2 facetLocal = fract(facetUV) - 0.5;
    
    // Diamond-shaped facets
    float facetEdge = abs(facetLocal.x) + abs(facetLocal.y);
    float facetLine = smoothstep(0.48, 0.42, facetEdge);
    
    // Animated light sweep hitting facets - sweeps from upper-right
    float lightSweep = sin(uv.x * 8.0 - uv.y * 6.0 - u_time * 0.6) * 0.5 + 0.5;
    lightSweep = pow(lightSweep, 4.0);
    
    // Prismatic burst at facet intersections
    float burst = facetLine * lightSweep;
    
    // Rainbow refraction colors based on angle
    float refractionHue = fract(angle / 6.28318 + scaledDist * 0.5 + u_time * 0.05);
    vec3 refractionColor = hsl2rgb(vec3(refractionHue, 0.9, 0.7));
    
    // ============================================
    // LAYER 4: Core Glow at anchor point
    // Bright mystical energy radiating from upper-right
    // ============================================
    float coreGlow = pow(max(0.0, 1.0 - scaledDist * 1.5), 3.0);
    float corePulse = sin(u_time * 2.0) * 0.15 + 0.85;
    coreGlow *= corePulse;
    
    // Core color - warm gold/white
    vec3 coreColor = mix(vec3(1.0, 0.9, 0.7), vec3(1.0, 1.0, 1.0), corePulse);
    
    // ============================================
    // COLOR COMPOSITION
    // ============================================
    
    // Base geometry color - mystical gold/white
    vec3 geoColor = mix(
        vec3(1.0, 0.95, 0.8),   // Warm gold
        vec3(0.9, 0.95, 1.0),   // Cool silver
        sin(angle * 2.0 + u_time * 0.3) * 0.5 + 0.5
    );
    
    // Radial line color - bright white with slight iridescence
    float lineHue = fract(scaledDist * 2.0 + u_time * 0.1);
    vec3 lineColor = mix(vec3(1.0), hsl2rgb(vec3(lineHue, 0.3, 0.9)), 0.2);
    
    // Combine all layers
    vec3 fractal = vec3(0.0);
    fractal += geoColor * geometry * 0.6;           // Sacred geometry
    fractal += lineColor * radialLines * 0.5;       // Radial lines
    fractal += refractionColor * burst * 0.8;       // Crystalline bursts
    fractal += coreColor * coreGlow * 0.7;          // Core glow from corner
    
    // Add subtle sparkle noise
    float sparkle = pow(snoise(uv * 50.0 + u_time * 0.2) * 0.5 + 0.5, 10.0) * 0.3;
    fractal += vec3(1.0, 0.98, 0.95) * sparkle;
    
    // Distance-based fade to bottom-left (opposite of anchor)
    float cornerFade = smoothstep(0.0, 0.4, scaledDist) * smoothstep(1.6, 1.0, scaledDist);
    fractal *= (0.5 + cornerFade * 0.5);
    
    // Final intensity
    float intensity = geometry * 0.4 + radialLines * 0.25 + burst * 0.5 + coreGlow * 0.35 + sparkle + 0.15;
    
    return vec4(fractal, intensity * 0.75);
}

vec4 holoVoid(vec2 uv) {
    // Cosmic Nebula - Deep Space Vortex
    // Anchor point at bottom-center of card, disk extends beyond top
    
    vec2 origin = vec2(0.5, 1.2); // Bottom center, slightly below card
    vec2 delta = uv - origin;
    float dist = length(delta);
    float angle = atan(delta.y, delta.x);
    
    // Spiral arm pattern - rotating inward toward origin
    float spiralAngle = angle - dist * 5.0 + u_time * 0.25;
    float spiral = sin(spiralAngle * 4.0) * 0.5 + 0.5;
    spiral = pow(spiral, 1.3);
    
    // Accretion disk - extends from origin outward past top of card
    float diskInner = 0.15;
    float diskOuter = 1.8; // Extends well beyond card top
    float diskFade = smoothstep(diskInner, diskInner + 0.2, dist) * smoothstep(diskOuter, diskOuter - 0.5, dist);
    
    // Disk brightness varies with spiral arms
    float diskBrightness = diskFade * (0.4 + spiral * 0.6);
    
    // Nebula gas noise layers for texture
    float gas1 = snoise(uv * 5.0 + vec2(u_time * 0.04, 0.0)) * 0.5 + 0.5;
    float gas2 = snoise(uv * 10.0 - vec2(0.0, u_time * 0.03)) * 0.5 + 0.5;
    float gasTexture = mix(gas1, gas2, 0.5);
    
    // Accretion disk colors - hot plasma gradient
    vec3 diskColor = mix(
        vec3(0.8, 0.2, 0.4),   // Magenta/red outer
        vec3(1.0, 0.7, 0.9),   // White-pink hot inner
        smoothstep(1.2, 0.3, dist)
    );
    // Add blue/purple tints based on spiral position
    diskColor = mix(diskColor, vec3(0.4, 0.3, 1.0), spiral * 0.35);
    diskColor = mix(diskColor, vec3(0.6, 0.1, 0.8), gasTexture * 0.25);
    
    // Embedded stars (brighten at distance from origin)
    float starField = pow(voronoi(uv * 30.0), 10.0);
    starField *= smoothstep(0.4, 0.8, dist); // Stars visible in outer regions
    
    // Bright core glow near origin
    float coreGlow = pow(max(0.0, 1.0 - dist * 1.5), 4.0);
    vec3 coreColor = vec3(1.0, 0.85, 0.95);
    
    // Card darkening - accretion is the PRIMARY light source
    float darkness = 0.05 + diskBrightness * 0.85; // Very dark base, heavily lit by disk
    
    // Combine all elements
    vec3 color = vec3(0.0);
    color += diskColor * diskBrightness * gasTexture * 1.4;  // Boosted accretion disk
    color += coreColor * coreGlow * 0.6;                      // Reduced core (accretion dominates)
    color += vec3(1.0, 0.95, 1.0) * starField * 0.4;         // Dimmer stars
    
    // Apply darkness overlay (card lit primarily by accretion)
    color *= darkness + 0.2;
    
    // Additional dark overlay to reduce overall brightness
    color *= 0.65;
    
    // Increased intensity by 50%: 1.3 -> 1.95
    float intensity = diskBrightness * 0.85 + coreGlow * 0.25 + starField * 0.15;
    return vec4(color, intensity * 1.95);
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
        // Gold - Polished luxury with sparkle dust and smooth sweeps
        
        // Elegant diagonal light sweep (slow, smooth)
        float sweep = sin((uv.x + uv.y) * 6.0 - u_time * 0.6) * 0.5 + 0.5;
        sweep = pow(sweep, 2.5);
        
        // Secondary perpendicular sweep for depth
        float sweep2 = sin((uv.x - uv.y) * 4.0 + u_time * 0.4) * 0.5 + 0.5;
        sweep2 = pow(sweep2, 3.0) * 0.4;
        
        // Sparkle dust particles - twinkling stars
        float sparkle1 = pow(snoise(uv * 50.0 + u_time * 0.3) * 0.5 + 0.5, 10.0);
        float sparkle2 = pow(snoise(uv * 35.0 - u_time * 0.25) * 0.5 + 0.5, 12.0) * 0.7;
        float sparkles = sparkle1 + sparkle2;
        
        // Soft breathing pulse
        float pulse = sin(u_time * 1.5) * 0.12 + 0.88;
        
        // Rich gold color palette
        vec3 deepGold = vec3(0.85, 0.65, 0.1);
        vec3 brightGold = vec3(1.0, 0.85, 0.3);
        vec3 whiteGold = vec3(1.0, 0.95, 0.7);
        
        // Color varies with sweeps
        glowColor = mix(deepGold, brightGold, sweep * 0.7 + sweep2);
        glowColor = mix(glowColor, whiteGold, (sweep + sweep2) * 0.3);
        
        // Sparkle highlights are bright white-gold
        glowColor += vec3(1.0, 0.95, 0.75) * sparkles * 1.2;
        
        glowIntensity = borderGlow * 0.55 * pulse + sweep * borderGlow * 0.2 + sparkles * 0.35;
    }
    else if (frameType == 4) {
        // Rainbow - Missing actual card border
        float hue = uv.x + uv.y + u_time * 0.3;
        glowColor = hsl2rgb(vec3(hue, 0.9, 0.6));
        
        // Add a soft inner border line (~3px equivalent)
        // usage of smoothstep creates a 2px anti-aliased edge instead of 1px hard cut
        float borderLine = smoothstep(0.016, 0.013, edgeDist); 
        
        // Combine soft glow with border
        // Border line is solid opacity, glow is fading
        glowIntensity = max(borderGlow * 0.5, borderLine * 0.85);
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
