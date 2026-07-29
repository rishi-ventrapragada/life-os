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
   * is why only 104 records exist rather than 208.
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

/** Depth ramp from the parallax design: nearer is brighter and faster. */
export const LAYERS: Record<LayerName, LayerSpec> = {
  near: { count: 30, durationSec: 42, maxOpacity: 0.95 },
  mid: { count: 34, durationSec: 78, maxOpacity: 0.6 },
  far: { count: 40, durationSec: 130, maxOpacity: 0.38 },
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

/** Seeds are arbitrary but fixed — changing one reshuffles that layer's sky. */
export const SEEDS: Record<LayerName, number> = {
  near: 5,
  mid: 5,
  far: 5,
};

export const STARS: Record<LayerName, readonly Star[]> = Object.freeze({
  near: Object.freeze([
    { x: 38.64, y: 21.98, size: 1, opacity: 0.717 },
    { x: 29.61, y: 72.01, size: 1, opacity: 0.615 },
    { x: 11.47, y: 77.99, size: 2, opacity: 0.79 },
    { x: 0.69, y: 46.54, size: 1, opacity: 0.518 },
    { x: 14.41, y: 75.53, size: 2, opacity: 0.779 },
    { x: 0.95, y: 79.35, size: 1, opacity: 0.461 },
    { x: 6.16, y: 47.01, size: 1, opacity: 0.945 },
    { x: 4.05, y: 84.86, size: 1, opacity: 0.528 },
    { x: 49.29, y: 27.2, size: 1, opacity: 0.571 },
    { x: 43.46, y: 72.24, size: 1, opacity: 0.875 },
    { x: 40.25, y: 64.92, size: 1, opacity: 0.419 },
    { x: 28.88, y: 31.52, size: 1, opacity: 0.813 },
    { x: 0.41, y: 93.2, size: 1, opacity: 0.543 },
    { x: 43.73, y: 24.92, size: 1, opacity: 0.441 },
    { x: 13.94, y: 99.83, size: 1, opacity: 0.341 },
    { x: 37.93, y: 31.42, size: 1, opacity: 0.741 },
    { x: 4, y: 73.5, size: 1, opacity: 0.657 },
    { x: 46.5, y: 4.95, size: 1, opacity: 0.786 },
    { x: 14.26, y: 53.32, size: 3, opacity: 0.861 },
    { x: 28.94, y: 95.65, size: 2, opacity: 0.766 },
    { x: 5.5, y: 29.4, size: 1, opacity: 0.659 },
    { x: 12.61, y: 76.69, size: 1, opacity: 0.418 },
    { x: 16.33, y: 80.56, size: 1, opacity: 0.73 },
    { x: 4.88, y: 29.05, size: 1, opacity: 0.923 },
    { x: 35.14, y: 74.42, size: 1, opacity: 0.396 },
    { x: 46.59, y: 60.57, size: 1, opacity: 0.401 },
    { x: 20.15, y: 5.19, size: 1, opacity: 0.593 },
    { x: 15.56, y: 76.68, size: 2, opacity: 0.365 },
    { x: 5.03, y: 51.19, size: 1, opacity: 0.843 },
    { x: 29.82, y: 10.09, size: 1, opacity: 0.557 },
  ]),
  mid: Object.freeze([
    { x: 38.64, y: 21.98, size: 1, opacity: 0.453 },
    { x: 29.61, y: 72.01, size: 1, opacity: 0.389 },
    { x: 11.47, y: 77.99, size: 2, opacity: 0.499 },
    { x: 0.69, y: 46.54, size: 1, opacity: 0.327 },
    { x: 14.41, y: 75.53, size: 2, opacity: 0.492 },
    { x: 0.95, y: 79.35, size: 1, opacity: 0.291 },
    { x: 6.16, y: 47.01, size: 1, opacity: 0.597 },
    { x: 4.05, y: 84.86, size: 1, opacity: 0.334 },
    { x: 49.29, y: 27.2, size: 1, opacity: 0.361 },
    { x: 43.46, y: 72.24, size: 1, opacity: 0.553 },
    { x: 40.25, y: 64.92, size: 1, opacity: 0.264 },
    { x: 28.88, y: 31.52, size: 1, opacity: 0.514 },
    { x: 0.41, y: 93.2, size: 1, opacity: 0.343 },
    { x: 43.73, y: 24.92, size: 1, opacity: 0.278 },
    { x: 13.94, y: 99.83, size: 1, opacity: 0.215 },
    { x: 37.93, y: 31.42, size: 1, opacity: 0.468 },
    { x: 4, y: 73.5, size: 1, opacity: 0.415 },
    { x: 46.5, y: 4.95, size: 1, opacity: 0.497 },
    { x: 14.26, y: 53.32, size: 3, opacity: 0.544 },
    { x: 28.94, y: 95.65, size: 2, opacity: 0.484 },
    { x: 5.5, y: 29.4, size: 1, opacity: 0.416 },
    { x: 12.61, y: 76.69, size: 1, opacity: 0.264 },
    { x: 16.33, y: 80.56, size: 1, opacity: 0.461 },
    { x: 4.88, y: 29.05, size: 1, opacity: 0.583 },
    { x: 35.14, y: 74.42, size: 1, opacity: 0.25 },
    { x: 46.59, y: 60.57, size: 1, opacity: 0.253 },
    { x: 20.15, y: 5.19, size: 1, opacity: 0.374 },
    { x: 15.56, y: 76.68, size: 2, opacity: 0.23 },
    { x: 5.03, y: 51.19, size: 1, opacity: 0.532 },
    { x: 29.82, y: 10.09, size: 1, opacity: 0.352 },
    { x: 12.71, y: 68.13, size: 1, opacity: 0.304 },
    { x: 49.23, y: 64.31, size: 1, opacity: 0.387 },
    { x: 1.93, y: 61.84, size: 1, opacity: 0.466 },
    { x: 7.23, y: 33.36, size: 1, opacity: 0.341 },
  ]),
  far: Object.freeze([
    { x: 38.64, y: 21.98, size: 1, opacity: 0.287 },
    { x: 29.61, y: 72.01, size: 1, opacity: 0.246 },
    { x: 11.47, y: 77.99, size: 2, opacity: 0.316 },
    { x: 0.69, y: 46.54, size: 1, opacity: 0.207 },
    { x: 14.41, y: 75.53, size: 2, opacity: 0.312 },
    { x: 0.95, y: 79.35, size: 1, opacity: 0.184 },
    { x: 6.16, y: 47.01, size: 1, opacity: 0.378 },
    { x: 4.05, y: 84.86, size: 1, opacity: 0.211 },
    { x: 49.29, y: 27.2, size: 1, opacity: 0.228 },
    { x: 43.46, y: 72.24, size: 1, opacity: 0.35 },
    { x: 40.25, y: 64.92, size: 1, opacity: 0.167 },
    { x: 28.88, y: 31.52, size: 1, opacity: 0.325 },
    { x: 0.41, y: 93.2, size: 1, opacity: 0.217 },
    { x: 43.73, y: 24.92, size: 1, opacity: 0.176 },
    { x: 13.94, y: 99.83, size: 1, opacity: 0.136 },
    { x: 37.93, y: 31.42, size: 1, opacity: 0.296 },
    { x: 4, y: 73.5, size: 1, opacity: 0.263 },
    { x: 46.5, y: 4.95, size: 1, opacity: 0.314 },
    { x: 14.26, y: 53.32, size: 3, opacity: 0.345 },
    { x: 28.94, y: 95.65, size: 2, opacity: 0.307 },
    { x: 5.5, y: 29.4, size: 1, opacity: 0.264 },
    { x: 12.61, y: 76.69, size: 1, opacity: 0.167 },
    { x: 16.33, y: 80.56, size: 1, opacity: 0.292 },
    { x: 4.88, y: 29.05, size: 1, opacity: 0.369 },
    { x: 35.14, y: 74.42, size: 1, opacity: 0.158 },
    { x: 46.59, y: 60.57, size: 1, opacity: 0.161 },
    { x: 20.15, y: 5.19, size: 1, opacity: 0.237 },
    { x: 15.56, y: 76.68, size: 2, opacity: 0.146 },
    { x: 5.03, y: 51.19, size: 1, opacity: 0.337 },
    { x: 29.82, y: 10.09, size: 1, opacity: 0.223 },
    { x: 12.71, y: 68.13, size: 1, opacity: 0.192 },
    { x: 49.23, y: 64.31, size: 1, opacity: 0.245 },
    { x: 1.93, y: 61.84, size: 1, opacity: 0.295 },
    { x: 7.23, y: 33.36, size: 1, opacity: 0.216 },
    { x: 47.44, y: 59.35, size: 1, opacity: 0.348 },
    { x: 14.17, y: 6.38, size: 1, opacity: 0.175 },
    { x: 11.35, y: 89.09, size: 1, opacity: 0.245 },
    { x: 38.86, y: 58.62, size: 1, opacity: 0.204 },
    { x: 38.73, y: 97.03, size: 2, opacity: 0.178 },
    { x: 40.25, y: 27.41, size: 1, opacity: 0.206 },
  ]),
});

/** Total star records, before the x+50 render-time duplicate. */
export const TOTAL_STARS = LAYERS.near.count + LAYERS.mid.count + LAYERS.far.count;
