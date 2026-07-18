"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type SessionValue = {
  /** Non-anonymous session only; null when logged out or still loading. */
  session: Session | null;
  status: "loading" | "authed" | "unauthed";
};

const SessionContext = createContext<SessionValue>({
  session: null,
  status: "loading",
});

/** Read the current auth session anywhere below <SessionProvider>. */
export function useSession(): SessionValue {
  return useContext(SessionContext);
}

/**
 * Single source of truth for the auth session, driven entirely by Supabase's
 * default session handling (localStorage + auto-refresh — no custom storage).
 *
 * Anonymous sign-ins were removed in Step 5, but the owner's browser may still
 * hold a stale anonymous session from before. We treat any `is_anonymous`
 * session as logged-out and sign it out, so a leftover anon token can never
 * slip past the login gate.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionValue>({
    session: null,
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    function apply(session: Session | null) {
      if (!active) return;
      if (session?.user.is_anonymous) {
        void supabase.auth.signOut(); // clear the stale anon token
        setState({ session: null, status: "unauthed" });
        return;
      }
      setState({ session, status: session ? "authed" : "unauthed" });
    }

    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      apply(session),
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}
