"use client";

/**
 * MobileNav — the section navigation for narrow (< md) viewports, where the wheel is a poor fit
 * (vertical drag competes with page scroll; arc touch targets are imprecise). Also serves as the
 * accessible text fallback for the wheel (owner decision Q4): a plain, labelled list of every
 * section. Hidden at md:+ where WheelNav takes over.
 *
 * Anchors (`#id`) get smooth scrolling and reduced-motion handling for free from globals.css
 * (`html { scroll-behavior: smooth }` + its prefers-reduced-motion override).
 *
 * Fixed to the bottom. The account block (components/AccountBlock.tsx) is `static` at < md and sits
 * in the normal page flow at the end of the content column, so the two never collide at 375px.
 */

const SECTIONS = [
  { id: "today", label: "Today" },
  { id: "goals", label: "Goals" },
  { id: "habits", label: "Habits" },
  { id: "tasks", label: "Tasks" },
  { id: "academics", label: "Academics" },
  { id: "fitness", label: "Fitness" },
  { id: "journal", label: "Journal" },
  { id: "pomodoro", label: "Pomodoro" },
] as const;

export default function MobileNav() {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-(--color-border) bg-(--color-surface)/95 backdrop-blur-sm md:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map(({ id, label }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              className="block rounded-lg px-3 py-1.5 text-sm text-(--color-text-muted)
                transition-transform duration-150
                hover:text-(--color-text)
                focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) focus-visible:text-(--color-text)
                active:scale-95"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
