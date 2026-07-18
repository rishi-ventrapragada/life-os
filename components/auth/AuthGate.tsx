"use client";

import type { ReactNode } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import LoginForm from "@/components/auth/LoginForm";

/**
 * The login gate. Logged-out (or still-loading) users see the login screen
 * only — no sidebar, no sections. The app tree mounts only for a real,
 * non-anonymous session, so its Supabase-backed effects never run for a
 * logged-out visitor. RLS remains the true data boundary underneath.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="animate-pulse text-sm text-(--color-text-muted)">
          Loading…
        </p>
      </div>
    );
  }

  if (status === "unauthed") {
    return <LoginForm />;
  }

  return <>{children}</>;
}
