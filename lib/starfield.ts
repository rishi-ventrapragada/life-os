/**
 * Star data for the parallax background (components/StarField.tsx, increment 2+).
 *
 * The field is a FROZEN LITERAL, not generated at runtime. Three reasons:
 * randomness during render breaks SSR/client agreement and React's purity rules;
 * a field that regenerates on re-render makes the stars visibly jump (the
 * design's own warning); and committed numbers mean the sky is identical for
 * every user on every load.
 *
 * `generateLayer` is exported anyway so the literal stays reproducible rather
 * than being unverifiable magic numbers — a test asserts that re-running the
 * seeded generator reproduces STARS exactly.
 */

export type Star = {
  /**
   * Left offset as a percentage of the 200%-wide layer, in [0, 50). The layer
   * holds the same field twice and slides -50%, so the second copy is this same
   * record rendered at x + 50 — the duplication is a render-time concern, which
   * is why the committed field holds one copy rather than two.
   */
  x: number;
  /** Top offset as a percentage of layer height, in [0, 100). */
  y: number;
  /** 1, 2 or 3 px. Most stars are 1px; larger ones carry a bloom. */
  size: number;
  /** Final per-star opacity, already scaled by the layer's max. */
  opacity: number;
  /**
   * Twinkle phase in [0, 1). Multiplied by the shared cycle length to give
   * each star its own animation-delay, so the near/mid layers pulse out of
   * step instead of blinking in unison. Generated here rather than at render
   * time because Math.random() during render breaks SSR agreement and React's
   * purity rules — the same reason the positions are a committed literal.
   */
  phase: number;
};

export type LayerName = "near" | "mid" | "far";

export type LayerSpec = {
  /** How many stars this layer holds (before the x+50 duplicate). */
  count: number;
  /** Seconds for one -50% slide. Longer = further away = slower parallax. */
  durationSec: number;
  /** Ceiling for per-star opacity; the depth cue that separates the layers. */
  maxOpacity: number;
};

/**
 * Depth ramp: nearer is denser, brighter and faster.
 *
 * Durations are a touch quicker than the design's original 42/78/130 — an
 * earlier pass slowed the whole ramp to 90/167/278 out of caution about
 * horizontal drift behind text, which read as too still against real content.
 *
 * The ramp is always scaled as a WHOLE, never one layer at a time. Setting near
 * alone to a slower value once inverted the parallax (near drifting slower than
 * the mid layer behind it), which reads as broken depth rather than calm. The
 * ratios here stay at roughly 1 : 1.84 : 3.06, matching the design.
 */
export const LAYERS: Record<LayerName, LayerSpec> = {
  near: { count: 46, durationSec: 32, maxOpacity: 1 },
  mid: { count: 52, durationSec: 59, maxOpacity: 0.72 },
  far: { count: 62, durationSec: 98, maxOpacity: 0.5 },
};

export const LAYER_ORDER: readonly LayerName[] = ["far", "mid", "near"];

/** Share of stars that are 1px. The rest split evenly between 2px and 3px. */
export const SMALL_STAR_RATIO = 0.84;

/**
 * Offset used to derive a layer's twinkle-phase stream from its seed, keeping
 * the phase draws off the position stream (see generateLayer).
 *
 * The layer's own `count` is mixed in as well, because all three layers share
 * seed 10 — offsetting alone would hand near/mid/far the identical phase
 * sequence, so stars at the same index in different layers would pulse in
 * perfect sync. count (46/52/62) differs per layer and breaks that tie.
 */
export const PHASE_SEED_OFFSET = 0x9e37;

/**
 * Mulberry32 — a tiny deterministic PRNG. Math.random() cannot be used here:
 * the whole point is that the same seed always yields the same sky, so the
 * committed literal below can be regenerated and verified.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/**
 * Builds one layer's stars. Positions land in [0, 50) on x so the rendered
 * duplicate at x + 50 tiles seamlessly. Opacity is scaled to the layer max with
 * a 0.35 floor, so even the dimmest star stays visible rather than vanishing.
 *
 * `phase` is drawn from a SEPARATE generator, not from `random`. Adding a
 * fifth draw to the shared stream would shift every star after the first and
 * reshuffle the whole committed sky — which would also invalidate the
 * 1px-ratio band that SEEDS was searched for. An independent stream keeps the
 * existing x/y/size/opacity byte-identical while still being deterministic.
 */
export function generateLayer(spec: LayerSpec, seed: number): Star[] {
  const random = createRandom(seed);
  const randomPhase = createRandom(seed + PHASE_SEED_OFFSET + spec.count);
  const stars: Star[] = [];

  for (let i = 0; i < spec.count; i++) {
    const sizeRoll = random();
    const size = sizeRoll < SMALL_STAR_RATIO ? 1 : sizeRoll < (1 + SMALL_STAR_RATIO) / 2 ? 2 : 3;
    stars.push({
      x: round(random() * 50, 2),
      y: round(random() * 100, 2),
      size,
      opacity: round(spec.maxOpacity * (0.35 + random() * 0.65), 3),
      phase: round(randomPhase(), 3),
    });
  }

  return stars;
}

/**
 * Fixed seeds — changing one reshuffles that layer's sky. Not arbitrary: seed
 * 10 was searched for and verified to keep all three layers' 1px share inside
 * the 80-88% band at the current counts (84.8% / 84.6% / 85.5%). Changing a
 * layer's `count` invalidates that and needs a fresh search.
 */
export const SEEDS: Record<LayerName, number> = {
  near: 10,
  mid: 10,
  far: 10,
};

export const STARS: Record<LayerName, readonly Star[]> = Object.freeze({
  near: Object.freeze([
    { x: 45.87, y: 69.13, size: 1, opacity: 0.871, phase: 0.787 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.404, phase: 0.34 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.434, phase: 0.394 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.952, phase: 0.979 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.453, phase: 0.427 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.663, phase: 0.221 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.686, phase: 0.355 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.398, phase: 0.867 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.443, phase: 0.959 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.759, phase: 0.139 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.947, phase: 0.282 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.437, phase: 0.825 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.36, phase: 0.735 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.87, phase: 0.507 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.839, phase: 0.722 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.388, phase: 0.981 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.453, phase: 0.23 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.955, phase: 0.936 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.99, phase: 0.574 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.482, phase: 0.021 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.905, phase: 0.967 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.54, phase: 0.785 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.853, phase: 0.27 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.518, phase: 0.328 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.369, phase: 0.855 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.678, phase: 0.698 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.663, phase: 0.458 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.93, phase: 0.728 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.706, phase: 0.675 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.728, phase: 0.008 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.828, phase: 0.605 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.373, phase: 0.081 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.79, phase: 0.444 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.688, phase: 0.963 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.514, phase: 0.246 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.903, phase: 0.74 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.872, phase: 0.648 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.67, phase: 0.239 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.456, phase: 0.047 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.956, phase: 0.744 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.416, phase: 0.735 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.557, phase: 0.143 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.68, phase: 0.164 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.385, phase: 0.079 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.661, phase: 0.224 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.481, phase: 0.291 },
  ]),
  mid: Object.freeze([
    { x: 45.87, y: 69.13, size: 1, opacity: 0.627, phase: 0.329 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.291, phase: 0.593 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.313, phase: 0.435 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.685, phase: 0.199 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.326, phase: 0.09 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.477, phase: 0.156 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.494, phase: 0.562 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.287, phase: 0.24 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.319, phase: 0.01 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.547, phase: 0.884 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.682, phase: 0.916 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.315, phase: 0.085 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.259, phase: 0.776 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.627, phase: 0.298 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.604, phase: 0.006 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.279, phase: 0.031 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.326, phase: 0.46 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.688, phase: 0.044 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.713, phase: 0.247 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.347, phase: 0.338 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.651, phase: 0.972 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.389, phase: 0.742 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.614, phase: 0.69 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.373, phase: 0.649 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.266, phase: 0.706 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.488, phase: 0.65 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.477, phase: 0.035 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.67, phase: 0.74 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.508, phase: 0.293 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.524, phase: 0.157 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.596, phase: 0.873 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.269, phase: 0.131 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.569, phase: 0.369 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.495, phase: 0.401 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.37, phase: 0.697 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.65, phase: 0.806 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.628, phase: 0.445 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.482, phase: 0.789 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.329, phase: 0.708 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.688, phase: 0.79 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.299, phase: 0.829 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.401, phase: 0.936 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.489, phase: 0.741 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.277, phase: 0.688 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.476, phase: 0.353 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.347, phase: 0.418 },
    { x: 43.51, y: 40.6, size: 1, opacity: 0.693, phase: 0.136 },
    { x: 2.58, y: 17.98, size: 1, opacity: 0.414, phase: 0.694 },
    { x: 31.9, y: 79.65, size: 1, opacity: 0.339, phase: 0.824 },
    { x: 47.78, y: 84.92, size: 1, opacity: 0.404, phase: 0.963 },
    { x: 18.55, y: 15.3, size: 2, opacity: 0.533, phase: 0.368 },
    { x: 40.33, y: 47.45, size: 1, opacity: 0.377, phase: 0.187 },
  ]),
  far: Object.freeze([
    { x: 45.87, y: 69.13, size: 1, opacity: 0.436, phase: 0.919 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.202, phase: 0.631 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.217, phase: 0.12 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.476, phase: 0.953 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.226, phase: 0.69 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.332, phase: 0.007 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.343, phase: 0.756 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.199, phase: 0.54 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.221, phase: 0.982 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.38, phase: 0.789 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.473, phase: 0.188 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.219, phase: 0.201 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.18, phase: 0.702 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.435, phase: 0.928 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.42, phase: 0.139 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.194, phase: 0.525 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.226, phase: 0.659 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.477, phase: 0.12 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.495, phase: 0.654 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.241, phase: 0.057 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.452, phase: 0.883 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.27, phase: 0.455 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.427, phase: 0.009 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.259, phase: 0.241 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.184, phase: 0.162 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.339, phase: 0.617 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.331, phase: 0.537 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.465, phase: 0.862 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.353, phase: 0.536 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.364, phase: 0.296 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.414, phase: 0.102 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.187, phase: 0.935 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.395, phase: 0.444 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.344, phase: 0.995 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.257, phase: 0.467 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.452, phase: 0.391 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.436, phase: 0.97 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.335, phase: 0.118 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.228, phase: 0.162 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.478, phase: 0.448 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.208, phase: 0.341 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.278, phase: 0.618 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.34, phase: 0.376 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.193, phase: 0.836 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.33, phase: 0.067 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.241, phase: 0.145 },
    { x: 43.51, y: 40.6, size: 1, opacity: 0.481, phase: 0.151 },
    { x: 2.58, y: 17.98, size: 1, opacity: 0.287, phase: 0.745 },
    { x: 31.9, y: 79.65, size: 1, opacity: 0.235, phase: 0.716 },
    { x: 47.78, y: 84.92, size: 1, opacity: 0.281, phase: 0.348 },
    { x: 18.55, y: 15.3, size: 2, opacity: 0.37, phase: 0.666 },
    { x: 40.33, y: 47.45, size: 1, opacity: 0.261, phase: 0.914 },
    { x: 23.83, y: 61.86, size: 1, opacity: 0.309, phase: 0.587 },
    { x: 37.08, y: 64.62, size: 1, opacity: 0.424, phase: 0.714 },
    { x: 48.28, y: 76.78, size: 2, opacity: 0.477, phase: 0.346 },
    { x: 23.27, y: 39.52, size: 1, opacity: 0.412, phase: 0.436 },
    { x: 5.42, y: 22.48, size: 1, opacity: 0.315, phase: 0.17 },
    { x: 33.51, y: 26.78, size: 1, opacity: 0.207, phase: 0.07 },
    { x: 23.15, y: 63.57, size: 1, opacity: 0.499, phase: 0.487 },
    { x: 24.9, y: 13.5, size: 1, opacity: 0.387, phase: 0.35 },
    { x: 29.24, y: 65.98, size: 1, opacity: 0.219, phase: 0.805 },
    { x: 29.01, y: 90.56, size: 1, opacity: 0.287, phase: 0.208 },
  ]),
});

/** Total star records, before the x+50 render-time duplicate. */
export const TOTAL_STARS = LAYERS.near.count + LAYERS.mid.count + LAYERS.far.count;

/**
 * Share of each meteor's cycle that it is actually visible. The other ~82% is
 * dead time with the streak parked off-screen, which is precisely what makes
 * meteors read as OCCASIONAL rather than as a shower. Both the travel and the
 * fade complete inside this window — see the keyframes in globals.css.
 */
export const METEOR_VISIBLE_FRACTION = 0.18;

export type Meteor = {
  /** Start of the rotated track, as a percentage of the viewport. */
  topPct: number;
  leftPct: number;
  /**
   * Track length in vw. This sizes the track's LAYOUT box only — it never
   * enters a transform, so a resize just relaws out the box instead of
   * re-interpolating an animation mid-flight.
   */
  lengthVw: number;
  /** Static tilt of the track. The child only ever translates along X. */
  angleDeg: number;
  /** One full cycle: a brief streak plus a long dead pause. */
  durationSec: number;
  /**
   * NEGATIVE, so the meteor is already partway through its cycle on first
   * paint. A positive delay would leave the sky empty for several seconds
   * after load, which reads as the feature being broken.
   */
  delaySec: number;
};

/**
 * Three meteors, hand-authored rather than generated — there are only a few, so
 * a PRNG would add machinery without adding value, and committed constants keep
 * the sky identical for every user (the same reasoning as the star literal).
 *
 * The durations are deliberately NON-HARMONIC — 9, 13 and 11 are pairwise
 * coprime, so no two ever settle into the visible lockstep that 8-and-16 (or
 * any integer multiple) would produce. All three only realign every 1287s.
 *
 * FREQUENCY IS TUNED BY COUNT, NOT BY CYCLE LENGTH. Shortening the durations
 * would also shorten each streak's flight, because the visible window is a
 * fraction of the cycle (METEOR_VISIBLE_FRACTION) — meteors would read as
 * hurried rather than as more frequent. Adding an instance raises the sighting
 * rate while every meteor keeps its unhurried pace.
 *
 * SEPARATION IS DELIBERATE, on two axes. An earlier pass had all three angles
 * within 6 degrees and entry points only ~13% apart, which put two streaks
 * within 15 units of each other (the viewport being 100 wide) — close enough to
 * read as converging or about to intersect. Now every pair differs by at least
 * 7 degrees in heading, so they visibly fan out rather than running parallel,
 * and the entry points are ~27-30% apart vertically. Closest simultaneous
 * on-screen approach is ~28 units.
 *
 * Retuning any topPct, angleDeg or delaySec can undo that, so re-check the
 * pairwise spacing rather than adjusting one value in isolation.
 */
export const METEORS: readonly Meteor[] = Object.freeze([
  Object.freeze({
    topPct: 5,
    leftPct: -10,
    lengthVw: 130,
    angleDeg: 12,
    durationSec: 9,
    delaySec: -2.5,
  }),
  Object.freeze({
    topPct: 32,
    leftPct: -18,
    lengthVw: 150,
    angleDeg: 27,
    durationSec: 13,
    delaySec: -10,
  }),
  Object.freeze({
    topPct: 62,
    leftPct: -14,
    lengthVw: 140,
    angleDeg: 19,
    durationSec: 11,
    delaySec: -6,
  }),
]);
