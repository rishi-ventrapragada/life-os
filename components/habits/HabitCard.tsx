"use client";

import GlowCard from "@/components/GlowCard";
import type { Habit } from "@/components/habits/types";

type HabitCardProps = {
  habit: Habit;
  /** False until the seed + session resolve (D1 guard) — the box stays inert. */
  ready: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
};

export default function HabitCard({
  habit,
  ready,
  onToggle,
  onEdit,
  onArchive,
}: HabitCardProps) {
  const { checkedToday } = habit;

  return (
    <GlowCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2.5 py-0.5 font-display text-[0.65rem] uppercase tracking-[0.15em] text-(--color-accent-soft)">
          {habit.area}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Archive
          </button>
        </div>
      </div>

      {/*
        The today-checkbox is the card's primary action: a real <button> with
        aria-pressed so it reads as a toggle, disabled until the hook is ready
        (D1 guard). Only transform/opacity animate — never transition-all.
      */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!ready}
        aria-pressed={checkedToday}
        className="group flex items-center gap-3 rounded-lg text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-[opacity,transform] duration-150 group-hover:not-disabled:scale-105 ${
            checkedToday
              ? "border-(--color-accent) bg-(--color-accent) text-white"
              : "border-(--color-border) text-transparent"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        </span>
        <span className="min-w-0">
          <span
            className={`block font-display text-xl font-semibold tracking-[-0.02em] ${
              checkedToday ? "text-(--color-text-muted) line-through" : ""
            }`}
          >
            {habit.name}
          </span>
          <span className="mt-0.5 block text-xs text-(--color-text-muted)">
            {checkedToday ? "Done today" : "Not yet today"}
          </span>
        </span>
      </button>
    </GlowCard>
  );
}
