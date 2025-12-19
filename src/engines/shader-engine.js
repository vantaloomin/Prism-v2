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
            if (animationsEnabled) {
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

// ============================================
// INTEGRATION HELPERS
// Multi-instance support for collection view
// ============================================

let activeShaderEngines = new Map(); // Map<cardElement, ShaderEngine>
let animationsEnabled = true;

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
        if (!animationsEnabled) {
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

console.log('✦ WebGL Shader Engine loaded (Multi-Instance Mode) ✦');
