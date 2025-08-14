precision highp float;

// Input textures
uniform sampler2D uPhoto;           // Original room photo
uniform sampler2D uWood;            // Wood texture
uniform sampler2D uFloorMask;       // Floor mask (0..1)
uniform sampler2D uOccluderMask;    // Furniture/occluder mask (0..1)
uniform sampler2D uIllum;           // Illumination map (0.8..1.2)

// Homography matrix (image pixels -> floor UV coordinates)
uniform mat3 uH;                    // H_img2uv
uniform vec2 uImageSize;            // Image width, height in pixels

// User controls
uniform float uRotation;            // Rotation in radians
uniform float uScale;               // Scale factor
uniform vec2 uPlankSize;            // Plank dimensions in "meters"
uniform int uPattern;               // Pattern style (0=random, 1=brick, 2=herringbone)
uniform float uSeed;                // Random seed for variation

varying vec2 vPos;                  // Screen position (0..1)

// Utility functions
vec2 rot2(float a) { 
    float c = cos(a), s = sin(a); 
    return vec2(c, -s); 
}

float hash(vec2 p) { 
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453 + uSeed); 
}

// Sample wood with herringbone pattern
vec4 sampleHerringbone(vec2 uv) {
    vec2 cell = floor(uv / uPlankSize);
    vec2 local = fract(uv / uPlankSize);
    
    // Alternate plank direction every other cell
    bool even = mod(cell.x + cell.y, 2.0) < 1.0;
    float ang = radians(even ? 45.0 : -45.0);
    
    // Rotate local coordinates
    mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec2 wuv = R * (local - 0.5) + 0.5;
    
    // Add jitter for natural variation
    float j = hash(cell) - 0.5;
    wuv += j * 0.02;
    
    // Sample wood texture with tiling
    vec4 wood = texture2D(uWood, fract(wuv * 4.0));
    
    // Darken edges for plank seams
    float edge = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
    wood.rgb *= mix(0.88, 1.0, smoothstep(0.0, 0.015, edge));
    
    return wood;
}

void main() {
    // Convert screen position to image pixel coordinates
    vec2 px = vPos * uImageSize;
    
    // Apply homography: image pixels -> floor UV coordinates
    vec3 p = vec3(px, 1.0);
    vec3 q = uH * p;                    // Transform to floor space
    vec2 uv = q.xy / q.z;               // Perspective divide
    
    // Apply user rotation and scale in floor space
    float c = cos(uRotation), s = sin(uRotation);
    mat2 R = mat2(c, -s, s, c);
    uv = R * (uv * uScale);
    
    // Sample wood texture based on pattern
    vec4 wood;
    if (uPattern == 2) {
        // Herringbone pattern
        wood = sampleHerringbone(uv);
    } else if (uPattern == 1) {
        // Brick pattern
        vec2 cell = floor(uv / uPlankSize);
        vec2 local = fract(uv / uPlankSize);
        
        // Offset every other row
        if (mod(cell.y, 2.0) < 1.0) {
            local.x += 0.5;
        }
        
        vec2 wuv = fract(local * 2.0);
        wood = texture2D(uWood, fract(wuv * 4.0));
        
        // Darken edges
        float edge = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
        wood.rgb *= mix(0.9, 1.0, smoothstep(0.0, 0.015, edge));
    } else {
        // Random plank pattern (default)
        vec2 cell = floor(uv / uPlankSize);
        vec2 local = fract(uv / uPlankSize);
        
        // Add jitter for natural variation
        vec2 jitter = (hash(cell + 0.37) - 0.5) * vec2(0.02, 0.02);
        vec2 wuv = local + jitter;
        
        wood = texture2D(uWood, fract(wuv * 4.0));
        
        // Darken edges
        float edge = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
        wood.rgb *= mix(0.9, 1.0, smoothstep(0.0, 0.015, edge));
    }
    
    // Sample masks and illumination
    float floorMask = texture2D(uFloorMask, vPos).r;      // 0..1 (floor area)
    float occluderMask = texture2D(uOccluderMask, vPos).r; // 0..1 (furniture)
    float illumination = texture2D(uIllum, vPos).r;        // 0.8..1.2 (lighting)
    
    // Sample original photo
    vec3 basePhoto = texture2D(uPhoto, vPos).rgb;
    
    // Apply wood with lighting
    vec3 woodWithLight = wood.rgb * illumination;
    
    // Composite: mix photo with wood based on floor mask and occluders
    // Only show wood where there's floor AND no occluders
    float blendFactor = floorMask * (1.0 - occluderMask);
    vec3 finalColor = mix(basePhoto, woodWithLight, blendFactor);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
