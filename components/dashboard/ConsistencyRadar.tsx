"use client";

import { useEffect, useRef } from "react";
import type { AreaConsistency } from "@/lib/dashboard";

/**
 * ConsistencyRadar — a hand-rolled inline SVG pentagon radar (no charting
 * library). Pure presentation: it renders whatever scores it is handed and
 * fetches nothing.
 *
 * Motion lives in globals.css (`.radar-plot` / `.radar-plot-in`), matching the
 * `.reveal` convention: the plotted group scales up from the pentagon centre
 * and fades in, transform + opacity ONLY. Geometry, stroke-dashoffset, fill and
 * filters are never animated. Rings, axes and labels are static.
 *
 * Why a local observer rather than <Reveal>: Reveal translates its child down
 * 24px, which would move the whole SVG. This needs a scale from the pentagon's
 * centre, applied to the plotted group alone.
 */

/**
 * The viewBox is WIDER than it is tall, and deliberately so. The pentagon's
 * widest vertices sit at ±0.95·RADIUS horizontally and their labels extend
 * outward from there, so a square box clips them — verified, not theorised: at
 * 320×320 "Personal Finance" rendered as "rsonal nance".
 *
 * 520×340 was measured with the real label set: the widest label box runs to
 * x≈421 (Fitness, left-anchored at the right vertex) and the leftmost starts at
 * x≈91, so every label sits inside the box with room to spare at 375px. Shrink
 * WIDTH only against a re-measure, not by eye.
 */
const WIDTH = 520;
const HEIGHT = 340;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
/** Outer pentagon radius. */
const RADIUS = 104;
/** Guide rings, as fractions of RADIUS. */
const RINGS = [0.25, 0.5, 0.75, 1];
/** How far beyond the pentagon the labels sit. */
const LABEL_OFFSET = 26;
/** Longer labels wrap rather than run into the shape. */
const MAX_LABEL_CHARS = 11;

type Point = { x: number; y: number };

/**
 * Vertex for axis `index` at `radius`. Angle is -90deg + index*72deg, so the
 * first axis points straight up and the rest run clockwise. SVG y grows
 * downward, which this sign convention already accounts for.
 */
function vertex(index: number, count: number, radius: number): Point {
  const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function toPoints(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

/** Scores may arrive from anywhere; keep the plot inside the pentagon. */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Text anchor from the vertex's horizontal position: labels on the right read
 * outward, labels on the left read inward, and top/bottom centre. Keeps long
 * names ("Content Creation") pointing away from the shape instead of over it.
 */
function anchorFor(x: number): "start" | "middle" | "end" {
  if (x > CX + 1) return "start";
  if (x < CX - 1) return "end";
  return "middle";
}

/** Split a long label onto two lines at a word boundary. */
function labelLines(label: string): string[] {
  if (label.length <= MAX_LABEL_CHARS || !label.includes(" ")) return [label];
  const words = label.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export default function ConsistencyRadar({ scores }: { scores: AreaConsistency[] }) {
  const plotRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;

    // No IntersectionObserver (very old browser): show the plot outright.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("radar-plot-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("radar-plot-in");
          obs.unobserve(entry.target); // reveal-once
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (scores.length === 0) return null;

  const count = scores.length;
  const values = scores.map((s) => clampScore(s.score));
  const dataPoints = values.map((value, i) =>
    vertex(i, count, (RADIUS * value) / 100),
  );
  // Every score at 0 collapses the polygon to a single point, which renders as
  // nothing. Draw a centre dot instead so the empty state still reads as "zero
  // everywhere" rather than a broken chart.
  const isCollapsed = values.every((v) => v === 0);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto block h-auto w-full max-w-xl"
      role="img"
      aria-label={`Habit consistency by life area over the last 30 days: ${scores
        .map((s) => `${s.area} ${clampScore(s.score)} percent`)
        .join(", ")}.`}
    >
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent-edge)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.18" />
        </radialGradient>
        {/* Static bloom for the vertex dots — a filter, never animated. */}
        <filter id="radar-dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Guide rings: nested pentagons, so they track the shape, not a circle.
          Deliberately --color-text-muted, NOT --color-border: the border token
          (#1c1a26) sits a few points off the near-black background, so no
          amount of opacity makes it read as a grid — the colour has to change,
          not the alpha. Muted grey at a low alpha gives a quiet scale the
          polygon can be measured against. The outer ring carries a little more
          weight than the inner ones so it frames the chart. */}
      <g stroke="var(--color-text-muted)" fill="none">
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={toPoints(
              Array.from({ length: count }, (_, i) =>
                vertex(i, count, RADIUS * ring),
              ),
            )}
            strokeOpacity={ring === 1 ? 0.38 : 0.26}
            strokeWidth={ring === 1 ? 1.25 : 1}
          />
        ))}
      </g>

      {/* Axis lines, centre to each vertex. */}
      <g stroke="var(--color-text-muted)" strokeOpacity="0.22" strokeWidth="1">
        {scores.map((score, i) => {
          const tip = vertex(i, count, RADIUS);
          return <line key={score.area} x1={CX} y1={CY} x2={tip.x} y2={tip.y} />;
        })}
      </g>

      {/* The plotted data — the only animated group. */}
      <g
        ref={plotRef}
        className="radar-plot"
        style={{ transformBox: "view-box", transformOrigin: `${CX}px ${CY}px` }}
      >
        {isCollapsed ? (
          <circle
            cx={CX}
            cy={CY}
            r="3.5"
            fill="var(--color-accent-soft)"
            filter="url(#radar-dot-glow)"
          />
        ) : (
          <>
            <polygon
              points={toPoints(dataPoints)}
              fill="url(#radar-fill)"
              stroke="var(--color-accent-edge)"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            {dataPoints.map((point, i) => (
              <circle
                key={scores[i].area}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="var(--color-accent-soft)"
                filter="url(#radar-dot-glow)"
              />
            ))}
          </>
        )}
      </g>

      {/* Labels sit outside the pentagon, reading away from the shape. */}
      <g fontFamily="var(--font-sans)">
        {scores.map((score, i) => {
          const at = vertex(i, count, RADIUS + LABEL_OFFSET);
          const lines = labelLines(score.area);
          const anchor = anchorFor(at.x);
          // Nudge two-line labels up so the pair stays centred on the axis.
          const top = at.y - (lines.length - 1) * 6;
          return (
            <text key={score.area} textAnchor={anchor} fontSize="11">
              {lines.map((line, li) => (
                <tspan key={line} x={at.x} y={top + li * 12} fill="var(--color-text-muted)">
                  {line}
                </tspan>
              ))}
              <tspan
                x={at.x}
                y={top + lines.length * 12 + 2}
                fill="var(--color-accent-soft)"
                fontSize="12"
                fontWeight="600"
              >
                {clampScore(score.score)}%
              </tspan>
            </text>
          );
        })}
      </g>
    </svg>
  );
}
