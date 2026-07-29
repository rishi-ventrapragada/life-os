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
 */
export function generateLayer(spec: LayerSpec, seed: number): Star[] {
  const random = createRandom(seed);
  const stars: Star[] = [];

  for (let i = 0; i < spec.count; i++) {
    const sizeRoll = random();
    const size = sizeRoll < SMALL_STAR_RATIO ? 1 : sizeRoll < (1 + SMALL_STAR_RATIO) / 2 ? 2 : 3;
    stars.push({
      x: round(random() * 50, 2),
      y: round(random() * 100, 2),
      size,
      opacity: round(spec.maxOpacity * (0.35 + random() * 0.65), 3),
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
    { x: 45.87, y: 69.13, size: 1, opacity: 0.871 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.404 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.434 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.952 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.453 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.663 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.686 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.398 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.443 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.759 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.947 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.437 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.36 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.87 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.839 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.388 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.453 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.955 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.99 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.482 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.905 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.54 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.853 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.518 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.369 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.678 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.663 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.93 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.706 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.728 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.828 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.373 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.79 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.688 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.514 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.903 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.872 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.67 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.456 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.956 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.416 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.557 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.68 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.385 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.661 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.481 },
  ]),
  mid: Object.freeze([
    { x: 45.87, y: 69.13, size: 1, opacity: 0.627 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.291 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.313 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.685 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.326 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.477 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.494 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.287 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.319 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.547 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.682 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.315 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.259 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.627 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.604 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.279 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.326 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.688 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.713 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.347 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.651 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.389 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.614 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.373 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.266 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.488 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.477 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.67 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.508 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.524 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.596 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.269 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.569 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.495 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.37 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.65 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.628 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.482 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.329 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.688 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.299 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.401 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.489 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.277 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.476 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.347 },
    { x: 43.51, y: 40.6, size: 1, opacity: 0.693 },
    { x: 2.58, y: 17.98, size: 1, opacity: 0.414 },
    { x: 31.9, y: 79.65, size: 1, opacity: 0.339 },
    { x: 47.78, y: 84.92, size: 1, opacity: 0.404 },
    { x: 18.55, y: 15.3, size: 2, opacity: 0.533 },
    { x: 40.33, y: 47.45, size: 1, opacity: 0.377 },
  ]),
  far: Object.freeze([
    { x: 45.87, y: 69.13, size: 1, opacity: 0.436 },
    { x: 22.42, y: 20.23, size: 1, opacity: 0.202 },
    { x: 49.84, y: 92.21, size: 1, opacity: 0.217 },
    { x: 19.4, y: 44.43, size: 1, opacity: 0.476 },
    { x: 40.41, y: 93.6, size: 1, opacity: 0.226 },
    { x: 34.77, y: 52.06, size: 1, opacity: 0.332 },
    { x: 17.12, y: 38.4, size: 1, opacity: 0.343 },
    { x: 25.64, y: 3.85, size: 1, opacity: 0.199 },
    { x: 7.33, y: 8.51, size: 1, opacity: 0.221 },
    { x: 24.19, y: 41.8, size: 1, opacity: 0.38 },
    { x: 7.89, y: 44.47, size: 1, opacity: 0.473 },
    { x: 39.48, y: 68.41, size: 1, opacity: 0.219 },
    { x: 43.98, y: 59.61, size: 1, opacity: 0.18 },
    { x: 35.97, y: 61.71, size: 1, opacity: 0.435 },
    { x: 19.44, y: 31.56, size: 1, opacity: 0.42 },
    { x: 19.43, y: 22.06, size: 1, opacity: 0.194 },
    { x: 22.06, y: 44.4, size: 2, opacity: 0.226 },
    { x: 21.19, y: 86.74, size: 2, opacity: 0.477 },
    { x: 8.17, y: 30.05, size: 1, opacity: 0.495 },
    { x: 27.74, y: 0.08, size: 3, opacity: 0.241 },
    { x: 37.02, y: 87.76, size: 1, opacity: 0.452 },
    { x: 16.32, y: 20.41, size: 2, opacity: 0.27 },
    { x: 45.13, y: 69.16, size: 3, opacity: 0.427 },
    { x: 20.49, y: 23.34, size: 1, opacity: 0.259 },
    { x: 17.6, y: 77.59, size: 1, opacity: 0.184 },
    { x: 43.93, y: 80.06, size: 1, opacity: 0.339 },
    { x: 40.47, y: 89.57, size: 1, opacity: 0.331 },
    { x: 12.95, y: 5.11, size: 1, opacity: 0.465 },
    { x: 34.24, y: 66.28, size: 1, opacity: 0.353 },
    { x: 17.41, y: 30.04, size: 1, opacity: 0.364 },
    { x: 34.2, y: 28.33, size: 1, opacity: 0.414 },
    { x: 29.96, y: 12.9, size: 3, opacity: 0.187 },
    { x: 40.38, y: 47.76, size: 1, opacity: 0.395 },
    { x: 40.03, y: 2.86, size: 1, opacity: 0.344 },
    { x: 25.07, y: 7.14, size: 1, opacity: 0.257 },
    { x: 45.29, y: 75.77, size: 1, opacity: 0.452 },
    { x: 10.89, y: 36.76, size: 1, opacity: 0.436 },
    { x: 10.05, y: 24.26, size: 3, opacity: 0.335 },
    { x: 36.36, y: 87.93, size: 1, opacity: 0.228 },
    { x: 7.96, y: 85.09, size: 1, opacity: 0.478 },
    { x: 41.39, y: 39.43, size: 1, opacity: 0.208 },
    { x: 43.22, y: 54.51, size: 1, opacity: 0.278 },
    { x: 26.25, y: 20.09, size: 1, opacity: 0.34 },
    { x: 26.59, y: 56.91, size: 1, opacity: 0.193 },
    { x: 26.9, y: 46.25, size: 1, opacity: 0.33 },
    { x: 23.35, y: 83.15, size: 1, opacity: 0.241 },
    { x: 43.51, y: 40.6, size: 1, opacity: 0.481 },
    { x: 2.58, y: 17.98, size: 1, opacity: 0.287 },
    { x: 31.9, y: 79.65, size: 1, opacity: 0.235 },
    { x: 47.78, y: 84.92, size: 1, opacity: 0.281 },
    { x: 18.55, y: 15.3, size: 2, opacity: 0.37 },
    { x: 40.33, y: 47.45, size: 1, opacity: 0.261 },
    { x: 23.83, y: 61.86, size: 1, opacity: 0.309 },
    { x: 37.08, y: 64.62, size: 1, opacity: 0.424 },
    { x: 48.28, y: 76.78, size: 2, opacity: 0.477 },
    { x: 23.27, y: 39.52, size: 1, opacity: 0.412 },
    { x: 5.42, y: 22.48, size: 1, opacity: 0.315 },
    { x: 33.51, y: 26.78, size: 1, opacity: 0.207 },
    { x: 23.15, y: 63.57, size: 1, opacity: 0.499 },
    { x: 24.9, y: 13.5, size: 1, opacity: 0.387 },
    { x: 29.24, y: 65.98, size: 1, opacity: 0.219 },
    { x: 29.01, y: 90.56, size: 1, opacity: 0.287 },
  ]),
});

/** Total star records, before the x+50 render-time duplicate. */
export const TOTAL_STARS = LAYERS.near.count + LAYERS.mid.count + LAYERS.far.count;
