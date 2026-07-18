"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/lib/supabase";

const links = [
  { id: "today", label: "Today" },
  { id: "goals", label: "Goals" },
  { id: "habits", label: "Habits" },
  { id: "tasks", label: "Tasks" },
  { id: "academics", label: "Academics" },
  { id: "fitness", label: "Fitness" },
  { id: "journal", label: "Journal" },
  { id: "pomodoro", label: "Pomodoro" },
];

export default function Sidebar() {
  const { session } = useSession();

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav
        aria-label="Sections"
        className="sticky top-8 mx-4 my-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      >
        <p className="px-3 font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
          Life OS
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {links.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-(--color-text-muted)
                  transition-transform duration-150
                  hover:translate-x-1 hover:text-(--color-text)
                  focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) focus-visible:text-(--color-text)
                  active:translate-x-0"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {session && (
          <div className="mt-4 border-t border-(--color-border) px-3 pt-4">
            <p
              className="truncate text-xs text-(--color-text-muted)"
              title={session.user.email ?? undefined}
            >
              {session.user.email}
            </p>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="mt-2 rounded-md text-sm text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
