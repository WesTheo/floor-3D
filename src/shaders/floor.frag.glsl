precision highp float;
uniform sampler2D uPhoto, uWood, uFloorMask, uOccluderMask, uIllum;
uniform mat3 uH;         // H_img2uv
uniform vec2 uImageSize; // W,H
uniform float uRotation, uScale;
uniform vec2 uPlankSize; // L,W in "meters"
uniform int uPattern;
uniform float uSeed;
varying vec2 vPos;

vec2 rot2(float a){ float c=cos(a), s=sin(a); return vec2(c,-s); } // used inline
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453 + uSeed); }

vec4 sampleHerringbone(vec2 uv){
  vec2 cell = floor(uv / uPlankSize);
  vec2 local = fract(uv / uPlankSize);
  bool even = mod(cell.x + cell.y, 2.0) < 1.0;
  float ang = radians(even ? 45.0 : -45.0);
  mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 wuv = R * (local - 0.5) + 0.5;
  float j = hash(cell) - 0.5;
  wuv += j * 0.02;
  vec4 wood = texture2D(uWood, fract(wuv * 4.0));
  float edge = min(min(local.x,1.0-local.x), min(local.y,1.0-local.y));
  wood.rgb *= mix(0.88, 1.0, smoothstep(0.0, 0.015, edge)); // seam darkening
  return wood;
}

void main(){
  vec2 px = vPos * uImageSize;              // pixel coords
  vec3 p = vec3(px, 1.0);
  vec3 q = uH * p;                          // img -> uv (projective)
  vec2 uv = q.xy / q.z;

  // apply direction + scale
  float c = cos(uRotation), s = sin(uRotation);
  mat2 R = mat2(c,-s,s,c);
  uv = R * (uv * uScale);

  vec4 wood;
  if (uPattern == 2) {
    wood = sampleHerringbone(uv);
  } else {
    // simple random planks as default
    vec2 cell = floor(uv / uPlankSize);
    vec2 local = fract(uv / uPlankSize);
    vec2 jitter = (hash(cell+0.37)-0.5) * vec2(0.02,0.02);
    vec2 wuv = local + jitter;
    wood = texture2D(uWood, fract(wuv * 4.0));
    float edge = min(min(local.x,1.0-local.x), min(local.y,1.0-local.y));
    wood.rgb *= mix(0.9, 1.0, smoothstep(0.0, 0.015, edge));
  }

  float m  = texture2D(uFloorMask, vPos).r;
  float occ= texture2D(uOccluderMask, vPos).r;
  float L  = texture2D(uIllum, vPos).r;

  vec3 base = texture2D(uPhoto, vPos).rgb;
  vec3 comp = wood.rgb * L;
  gl_FragColor = vec4(mix(base, comp, m*(1.0-occ)), 1.0);
}
