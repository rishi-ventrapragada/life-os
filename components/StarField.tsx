import { LAYER_ORDER, STARS } from "@/lib/starfield";

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
 * Increment 2: one static copy of each layer, no motion. The second copy at
 * x + 50 that makes the slide seamless arrives with the animation in increment 3.
 */
export default function StarField() {
  return (
    <div aria-hidden="true" className="starfield">
      {LAYER_ORDER.map((layer) => (
        <div key={layer} className="starfield-layer" data-layer={layer}>
          {STARS[layer].map((star, index) => (
            <span
              key={index}
              className="starfield-star"
              // Only 2px+ stars bloom, and the blur scales with the star, per
              // the design. 1px stars stay flat so the field reads as fine
              // starlight rather than a field of glowing dots.
              data-bloom={star.size > 1 ? "" : undefined}
              style={
                {
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  "--bloom-blur": `${star.size * 2}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
