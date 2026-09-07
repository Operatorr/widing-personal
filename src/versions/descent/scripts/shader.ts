// Hero light-shaft shader. One job: the lit surface above a dark descent.
// Value noise and hash are written here so no noise library is needed.

export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float t = uTime * 0.06;

  // Shafts lean slightly with the pointer and sway slowly with time.
  float lean = (uPointer.x - 0.5) * 0.18 + sin(t * 0.9) * 0.04;
  float x = uv.x * aspect + (1.0 - uv.y) * (0.22 + lean);

  float s1 = vnoise(vec2(x * 5.0, t));
  float s2 = vnoise(vec2(x * 11.0 + 3.1, t * 1.4 + 2.0));
  float s3 = vnoise(vec2(x * 2.2 - 7.0, t * 0.5 + 5.0));
  float shafts = pow(clamp(s1 * 0.5 + s2 * 0.2 + s3 * 0.45, 0.0, 1.0), 2.2);

  // Bright near the surface (top), gone by the bottom of the hero.
  float fromSurface = pow(uv.y, 1.5);

  // Caustic shimmer just under the surface: two layers, sharper near the top.
  float c = fbm(vec2(uv.x * aspect * 6.0 + t * 2.0, uv.y * 6.0 - t * 1.2));
  float c2 = fbm(vec2(uv.x * aspect * 9.0 - t * 1.5 + 4.0, uv.y * 9.0 + t));
  float caustic = smoothstep(0.48, 0.78, c * 0.6 + c2 * 0.4) * smoothstep(0.45, 1.0, uv.y);

  // The water itself: a lit surface band that drops to the abyss.
  vec3 surface = vec3(0.14, 0.37, 0.53);
  vec3 abyss = vec3(0.008, 0.020, 0.035);
  vec3 cyan = vec3(0.373, 0.827, 1.000);
  vec3 white = vec3(0.905, 0.960, 0.985);

  vec3 col = mix(abyss, surface, pow(uv.y, 1.35));

  float descent = 1.0 - uScroll;
  // Shafts go whiter the closer they are to the surface.
  vec3 shaftColor = mix(cyan, white, fromSurface * 0.7);
  float light = (shafts * fromSurface * 1.0 + caustic * 0.5) * descent;
  col += shaftColor * light * 0.55;

  // Waterline: a soft pale band along the very top, rippling with the caustics.
  float ripple = 0.015 * sin(uv.x * aspect * 14.0 + t * 6.0) + 0.01 * sin(uv.x * aspect * 31.0 - t * 9.0);
  float waterline = smoothstep(0.86 + ripple, 1.0, uv.y);
  col = mix(col, white, waterline * 0.4 * descent);

  // A faint glow where the pointer is, as if a torch under water.
  vec2 pd = (uv - uPointer) * vec2(aspect, 1.0);
  col += cyan * 0.06 * smoothstep(0.55, 0.0, length(pd)) * descent;

  // Film grain, so gradients don't band.
  col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;
