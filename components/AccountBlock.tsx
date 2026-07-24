"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/lib/supabase";

/**
 * The account control (signed-in email + Sign out), rendered INDEPENDENTLY of
 * the sidebar so it stays reachable at every width. The sidebar is `hidden
 * md:block`, so anything inside it disappears on mobile — this block lives
 * outside it, fixed bottom-left, and is present at 375px through desktop.
 *
 * Renders nothing when logged out. Width is constrained fluidly (min()), never
 * a fixed pixel container, so it can't cause horizontal scroll at 375px.
 */
export default function AccountBlock() {
  const { session } = useSession();

  if (!session) return null;

  return (
    <div className="fixed bottom-16 left-4 z-40 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-(--color-border) bg-(--color-surface)/95 px-4 py-3 backdrop-blur-sm md:bottom-4">
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
