import { describe, it, expect } from "vitest";
import {
  LAYERS,
  LAYER_ORDER,
  METEORS,
  METEOR_VISIBLE_FRACTION,
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
    expect(STARS.near).toHaveLength(46);
    expect(STARS.mid).toHaveLength(52);
    expect(STARS.far).toHaveLength(62);
    expect(TOTAL_STARS).toBe(160);
  });

  it("gets denser with distance", () => {
    // More stars further away reinforces the depth read, and the far layer's
    // lower opacity keeps the extra count from making it busy.
    expect(LAYERS.far.count).toBeGreaterThan(LAYERS.mid.count);
    expect(LAYERS.mid.count).toBeGreaterThan(LAYERS.near.count);
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

describe("twinkle phase", () => {
  it("stays within [0, 1)", () => {
    for (const name of NAMES) {
      for (const star of STARS[name]) {
        expect(star.phase).toBeGreaterThanOrEqual(0);
        expect(star.phase).toBeLessThan(1);
      }
    }
  });

  it("is well spread, so the layer does not pulse in unison", () => {
    // The whole point of a per-star phase is desync. A degenerate generator
    // (every star landing on one value) would still pass the range check
    // above while making the field blink as one.
    for (const name of NAMES) {
      const unique = new Set(STARS[name].map((s) => s.phase));
      expect(unique.size).toBeGreaterThan(STARS[name].length * 0.9);
      const values = STARS[name].map((s) => s.phase);
      expect(Math.min(...values)).toBeLessThan(0.1);
      expect(Math.max(...values)).toBeGreaterThan(0.9);
    }
  });

  it("differs between layers, which all share seed 10", () => {
    // Without mixing count into the phase seed, near/mid/far would get the
    // identical sequence and same-index stars would pulse together.
    const near = STARS.near.map((s) => s.phase);
    expect(STARS.mid.slice(0, near.length).map((s) => s.phase)).not.toEqual(near);
    expect(STARS.far.slice(0, near.length).map((s) => s.phase)).not.toEqual(near);
  });

  it("leaves position and brightness untouched by the phase stream", () => {
    // Guards the reason PHASE_SEED_OFFSET exists: phase is drawn from its own
    // generator, so the committed sky must match a generator that never draws
    // a phase at all. If someone folds phase back into the position stream,
    // every star shifts and this fails.
    for (const name of NAMES) {
      const random = createRandom(SEEDS[name]);
      for (const star of STARS[name]) {
        const sizeRoll = random();
        const size = sizeRoll < SMALL_STAR_RATIO ? 1 : sizeRoll < (1 + SMALL_STAR_RATIO) / 2 ? 2 : 3;
        const x = Math.round(random() * 50 * 100) / 100;
        const y = Math.round(random() * 100 * 100) / 100;
        const opacity =
          Math.round(LAYERS[name].maxOpacity * (0.35 + random() * 0.65) * 1000) / 1000;
        expect({ x: star.x, y: star.y, size: star.size, opacity: star.opacity }).toEqual({
          x,
          y,
          size,
          opacity,
        });
      }
    }
  });
});

describe("meteors", () => {
  it("is a frozen literal holding the designed instances", () => {
    expect(Object.isFrozen(METEORS)).toBe(true);
    expect(METEORS).toHaveLength(3);
    for (const meteor of METEORS) expect(Object.isFrozen(meteor)).toBe(true);
  });

  it("stays a handful, so the sky never becomes a shower", () => {
    // Frequency is tuned by instance count, so this is the guard that stops it
    // creeping upward one meteor at a time.
    expect(METEORS.length).toBeLessThanOrEqual(4);
  });

  it("stays occasional rather than a shower", () => {
    // The visible window is the whole reason meteors read as rare. If this
    // creeps up, the sky turns into a meteor shower.
    expect(METEOR_VISIBLE_FRACTION).toBeLessThan(0.25);
    expect(METEOR_VISIBLE_FRACTION).toBeGreaterThan(0);
  });

  it("never fires any pair in lockstep", () => {
    // Checked pairwise across every meteor, not just the first two — adding a
    // third that happened to be an integer multiple of an existing one would
    // reintroduce the repeating pattern this guards against.
    for (let i = 0; i < METEORS.length; i++) {
      for (let j = i + 1; j < METEORS.length; j++) {
        const a = METEORS[i].durationSec;
        const b = METEORS[j].durationSec;
        expect(a).not.toBe(b);
        // Non-harmonic: an integer ratio (8 and 16) would resynchronise every
        // second cycle and read as a pattern rather than as chance.
        expect(Math.max(a, b) % Math.min(a, b)).not.toBe(0);
      }
    }
  });

  it("starts every meteor mid-cycle, so the sky is never empty on load", () => {
    for (const meteor of METEORS) {
      expect(meteor.delaySec).toBeLessThan(0);
      // A delay beyond one full cycle just wraps — it would still work, but it
      // signals the value was picked without reference to the duration.
      expect(Math.abs(meteor.delaySec)).toBeLessThan(meteor.durationSec);
    }
  });

  it("fans the meteors out instead of running them parallel", () => {
    // Angles within a few degrees of each other read as one flock moving in
    // the same direction. Every pair must differ clearly in heading.
    for (let i = 0; i < METEORS.length; i++) {
      for (let j = i + 1; j < METEORS.length; j++) {
        expect(Math.abs(METEORS[i].angleDeg - METEORS[j].angleDeg)).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("keeps entry points well apart vertically", () => {
    // Meteors entering at similar heights converge near the left edge, which
    // is what made an earlier pass look like the streaks were intersecting.
    const tops = METEORS.map((m) => m.topPct).sort((a, b) => a - b);
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i] - tops[i - 1]).toBeGreaterThanOrEqual(20);
    }
  });

  it("never lets two visible meteors approach each other on screen", () => {
    // The real guard: simulate the paths over a full resync period and assert
    // no two SIMULTANEOUSLY VISIBLE streaks come close while both are on
    // screen. Pins the geometry that the angle/entry checks only approximate.
    const rad = (d: number) => (d * Math.PI) / 180;
    const paths = METEORS.map((m) => ({
      m,
      x0: m.leftPct,
      y0: m.topPct,
      x1: m.leftPct + m.lengthVw * Math.cos(rad(m.angleDeg)),
      y1: m.topPct + m.lengthVw * Math.sin(rad(m.angleDeg)),
    }));

    const head = (p: (typeof paths)[number], t: number) => {
      const cycle = p.m.durationSec;
      const phase = (((t - p.m.delaySec) % cycle) + cycle) % cycle;
      const f = phase / cycle;
      if (f > METEOR_VISIBLE_FRACTION) return null; // parked off-screen
      const u = f / METEOR_VISIBLE_FRACTION;
      return { x: p.x0 + (p.x1 - p.x0) * u, y: p.y0 + (p.y1 - p.y0) * u };
    };
    const onScreen = (p: { x: number; y: number }) =>
      p.x > -5 && p.x < 105 && p.y > -5 && p.y < 105;

    let closest = Infinity;
    for (let t = 0; t < 1287; t += 0.1) {
      const live = paths.map((p) => head(p, t));
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i];
          const b = live[j];
          if (!a || !b || !onScreen(a) || !onScreen(b)) continue;
          closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
        }
      }
    }
    // Viewport is 100 units wide. Under ~20 reads as a near-intersection.
    expect(closest).toBeGreaterThan(20);
  });

  it("keeps the track geometry sane", () => {
    for (const meteor of METEORS) {
      // A shallow tilt. Near 0 reads as a horizontal glitch, near 90 as rain.
      expect(meteor.angleDeg).toBeGreaterThan(5);
      expect(meteor.angleDeg).toBeLessThan(45);
      // Longer than the viewport, so the streak is fully off-screen when parked
      // at translateX(100%) rather than clipping visibly at the edge.
      expect(meteor.lengthVw).toBeGreaterThan(100);
      // Starts left of the viewport so it enters from off-screen.
      expect(meteor.leftPct).toBeLessThanOrEqual(0);
      expect(meteor.topPct).toBeGreaterThanOrEqual(0);
      expect(meteor.topPct).toBeLessThan(100);
    }
  });
});

describe("layer specs", () => {
  it("carries the tuned durations", () => {
    expect(LAYERS.near.durationSec).toBe(32);
    expect(LAYERS.mid.durationSec).toBe(59);
    expect(LAYERS.far.durationSec).toBe(98);
  });

  it("preserves the design's speed RATIOS at any overall tempo", () => {
    // The ramp is always scaled as a whole. This is the guard against the
    // inversion that happened once when a single layer was retuned alone.
    const ratio = (a: number, b: number) => a / b;
    expect(ratio(LAYERS.mid.durationSec, LAYERS.near.durationSec)).toBeCloseTo(
      78 / 42,
      1,
    );
    expect(ratio(LAYERS.far.durationSec, LAYERS.near.durationSec)).toBeCloseTo(
      130 / 42,
      1,
    );
  });

  it("gets slower with distance, which is the parallax", () => {
    expect(LAYERS.near.durationSec).toBeLessThan(LAYERS.mid.durationSec);
    expect(LAYERS.mid.durationSec).toBeLessThan(LAYERS.far.durationSec);
  });

  it("orders layers back-to-front for rendering", () => {
    expect(LAYER_ORDER).toEqual(["far", "mid", "near"]);
  });
});
