"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/lib/supabase";

/**
 * The account control (signed-in email + Sign out), rendered INDEPENDENTLY of
 * the sidebar so it stays reachable at every width. The sidebar is `hidden
 * md:block`, so anything inside it disappears on mobile.
 *
 * Two layouts, one component:
 * - < md: `static`, full-width, rendered in the normal page flow at the end of
 *   the content column (after PomodoroSection) — it scrolls with the page and
 *   can never overlap the fixed MobileNav bar.
 * - md+: `fixed` bottom-left, fluidly width-capped with min(), floating over
 *   the page alongside the wheel nav.
 *
 * Renders nothing when logged out. Width is constrained fluidly (min()), never
 * a fixed pixel container, so it can't cause horizontal scroll at 375px.
 */
export default function AccountBlock() {
  const { session } = useSession();

  if (!session) return null;

  return (
    <div className="static w-full rounded-xl border border-(--color-border) bg-(--color-surface)/95 px-4 py-3 backdrop-blur-sm md:fixed md:bottom-4 md:left-4 md:z-40 md:w-[min(16rem,calc(100vw-2rem))]">
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
  );
}
