import { LAYERS, LAYER_ORDER, STARS, type LayerName } from "@/lib/starfield";

/**
 * Layers whose stars twinkle. Far is deliberately excluded: pulsing all three
 * depths at once reads as noise rather than starlight, and far is the densest
 * layer (62 stars) so it would also carry the largest animation cost for the
 * least visible payoff.
 */
const TWINKLE_LAYERS: readonly LayerName[] = ["near", "mid"];

/**
 * One shared twinkle cycle length, in seconds. Every twinkling star uses this
 * duration; only the per-star delay differs, which is what desyncs them. Kept
 * slow on purpose — the field sits behind card text, so the pulse should read
 * as barely-there rather than sparkle.
 */
const TWINKLE_DURATION_SEC = 7;

/**
 * The field is rendered twice per layer, the second copy shifted +50%. The
 * layer is 200% wide and slides -50%, so at the end of each cycle the second
 * copy sits exactly where the first began and the loop point is invisible.
 * lib/starfield.ts guarantees every x < 50, so the copies never overlap.
 */
const COPY_OFFSETS = [0, 50] as const;

/**
 * The parallax star background, rendered once app-wide in app/layout.tsx.
 *
 * Deliberately a SERVER component — no "use client". It has no state, effects
 * or handlers, only static markup built from the frozen field in
 * lib/starfield.ts, so it ships zero JavaScript to the browser. The whole
 * effect lives in CSS.
 *
 * aria-hidden because it is pure decoration: without it a screen reader would
 * walk 104 empty spans on every page.
 *
 * Positioning (see .starfield in globals.css): fixed, so it never scrolls with
 * the page or adds document height, and pointer-events: none so it can never
 * intercept a click. It sits at z-index 0 rather than -1 — body paints
 * --color-bg, which would cover a negative layer — so page content is lifted to
 * z-10 instead.
 *
 * Motion is all CSS: the per-layer parallax drift, and a per-star opacity
 * twinkle on the near and mid layers (see TWINKLE_LAYERS). Both are declarative,
 * so this stays a zero-JavaScript server component.
 */
export default function StarField() {
  return (
    <div aria-hidden="true" className="starfield">
      {LAYER_ORDER.map((layer) => {
        const twinkles = TWINKLE_LAYERS.includes(layer);
        return (
        <div
          key={layer}
          className="starfield-layer"
          data-layer={layer}
          style={{ "--dur": `${LAYERS[layer].durationSec}s` } as React.CSSProperties}
        >
          {COPY_OFFSETS.flatMap((offset) =>
            STARS[layer].map((star, index) => (
              <span
                key={`${offset}-${index}`}
                className="starfield-star"
                // Only 2px+ stars bloom, and the blur scales with the star, per
                // the design. 1px stars stay flat so the field reads as fine
                // starlight rather than a field of glowing dots.
                data-bloom={star.size > 1 ? "" : undefined}
                data-twinkle={twinkles ? "" : undefined}
                style={
                  {
                    left: `${star.x + offset}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    "--bloom-blur": `${star.size * 2}px`,
                    // A twinkling star's base opacity travels as a custom
                    // property instead: the keyframe pulses between it and a
                    // fraction of it, and a CSS animation overrides the plain
                    // `opacity` it targets, so an inline opacity would be
                    // ignored. Undefined entries are simply dropped by React.
                    opacity: twinkles ? undefined : star.opacity,
                    "--star-opacity": twinkles ? star.opacity : undefined,
                    "--twinkle-delay": twinkles
                      ? `${-star.phase * TWINKLE_DURATION_SEC}s`
                      : undefined,
                  } as React.CSSProperties
                }
              />
            )),
          )}
        </div>
        );
      })}
    </div>
  );
}
