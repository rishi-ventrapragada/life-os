"use client";

import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import ConsistencyRadar from "@/components/dashboard/ConsistencyRadar";
import { useDashboard } from "@/components/dashboard/useDashboard";

/**
 * Analytics (v2) — habit consistency per life area over the trailing 30 IST
 * days, drawn as the pentagon radar. Read-only: nothing here writes.
 *
 * There is deliberately no separate "no data yet" state. computeAreaConsistency
 * always returns all five areas, so a brand-new account renders a radar of
 * zeros — the empty state IS the chart, and it shows the five axes waiting to
 * be filled rather than a dead-end message.
 *
 * Same v1 trade-off as TodaySection (Step 9 decision F, recorded in FUTURE.md):
 * this mounts its own hook instance, so checking a habit elsewhere on the page
 * won't move the radar until a refresh. Consistent with how Today and Habits
 * already behave; lifting state into a provider is the fix when it bites.
 */
export default function AnalyticsSection() {
  const { areaScores, status, error } = useDashboard();

  return (
    <section id="analytics" className="scroll-mt-8">
      {/* No eyebrow here by design — the radar's own labels already say what
          it measures, so a strapline above the title would just repeat them. */}
      <SectionHeader title="Analytics" />

      <Reveal className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {status === "loading" ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">Loading analytics…</p>
          </GlowCard>
        ) : (
          // On error the hook leaves areaScores empty and the radar would
          // render nothing, so show the alert alone rather than an empty card.
          status === "ready" && (
            <GlowCard>
              <ConsistencyRadar scores={areaScores} />
            </GlowCard>
          )
        )}
      </Reveal>
    </section>
  );
}
