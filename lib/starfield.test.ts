import { describe, it, expect } from "vitest";
import {
  LAYERS,
  LAYER_ORDER,
  SEEDS,
  SMALL_STAR_RATIO,
  STARS,
  TOTAL_STARS,
  createRandom,
  generateLayer,
  type LayerName,
} from "@/lib/starfield";

/**
 * The star field is a committed literal, so these tests do two jobs: they pin
 * the invariants the renderer depends on (x stays in the tiling half, opacity
 * never exceeds its layer's ceiling), and they prove the literal is exactly
 * what the seeded generator produces — without that last check the numbers
 * would be unverifiable magic.
 */

const NAMES: LayerName[] = ["near", "mid", "far"];

describe("createRandom — deterministic PRNG", () => {
  it("the same seed yields the same sequence", () => {
    const a = createRandom(5);
    const b = createRandom(5);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("different seeds diverge", () => {
    const a = createRandom(5);
    const b = createRandom(6);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it("stays within [0, 1)", () => {
    const random = createRandom(5);
    for (let i = 0; i < 500; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("STARS — the committed field", () => {
  it("matches what the seeded generator produces", () => {
    // The check that makes the literal trustworthy: regenerate and compare.
    for (const name of NAMES) {
      expect(STARS[name]).toEqual(generateLayer(LAYERS[name], SEEDS[name]));
    }
  });

  it("holds exactly the designed star counts", () => {
    expect(STARS.near).toHaveLength(30);
    expect(STARS.mid).toHaveLength(34);
    expect(STARS.far).toHaveLength(40);
    expect(TOTAL_STARS).toBe(104);
  });

  it("is frozen, so shared star data cannot be mutated", () => {
    expect(Object.isFrozen(STARS)).toBe(true);
    for (const name of NAMES) expect(Object.isFrozen(STARS[name])).toBe(true);
  });
});

describe("star geometry", () => {
  it("keeps x inside the tiling half [0, 50)", () => {
    // The layer is 200% wide holding the field twice; the duplicate renders at
    // x + 50. An x >= 50 would overlap its own copy and break the seam.
    for (const name of NAMES) {
      for (const star of STARS[name]) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThan(50);
      }
    }
  });

  it("keeps y inside [0, 100)", () => {
    for (const name of NAMES) {
      for (const star of STARS[name]) {
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThan(100);
      }
    }
  });

  it("only uses 1px, 2px or 3px stars", () => {
    for (const name of NAMES) {
      for (const star of STARS[name]) {
        expect([1, 2, 3]).toContain(star.size);
      }
    }
  });

  it("is dominated by 1px stars, near the designed ratio", () => {
    // A range, not an exact count: 84% of 30 is not an integer, and the point
    // is that the field reads as fine starlight rather than a field of dots.
    for (const name of NAMES) {
      const small = STARS[name].filter((s) => s.size === 1).length;
      const ratio = small / STARS[name].length;
      expect(ratio).toBeGreaterThanOrEqual(0.8);
      expect(ratio).toBeLessThanOrEqual(0.88);
    }
    expect(SMALL_STAR_RATIO).toBe(0.84);
  });
});

describe("opacity ramp", () => {
  it("never exceeds its layer's ceiling", () => {
    for (const name of NAMES) {
      for (const star of STARS[name]) {
        expect(star.opacity).toBeLessThanOrEqual(LAYERS[name].maxOpacity);
      }
    }
  });

  it("respects the 0.35 floor, so no star is invisible", () => {
    for (const name of NAMES) {
      // Rounded to 3 places, so allow a hair under the exact product.
      const floor = LAYERS[name].maxOpacity * 0.35 - 0.001;
      for (const star of STARS[name]) {
        expect(star.opacity).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("gets dimmer with distance", () => {
    expect(LAYERS.near.maxOpacity).toBeGreaterThan(LAYERS.mid.maxOpacity);
    expect(LAYERS.mid.maxOpacity).toBeGreaterThan(LAYERS.far.maxOpacity);
  });
});

describe("layer specs", () => {
  it("carries the design's durations", () => {
    expect(LAYERS.near.durationSec).toBe(42);
    expect(LAYERS.mid.durationSec).toBe(78);
    expect(LAYERS.far.durationSec).toBe(130);
  });

  it("gets slower with distance, which is the parallax", () => {
    expect(LAYERS.near.durationSec).toBeLessThan(LAYERS.mid.durationSec);
    expect(LAYERS.mid.durationSec).toBeLessThan(LAYERS.far.durationSec);
  });

  it("orders layers back-to-front for rendering", () => {
    expect(LAYER_ORDER).toEqual(["far", "mid", "near"]);
  });
});
