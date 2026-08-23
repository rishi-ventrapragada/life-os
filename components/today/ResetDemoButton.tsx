"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/demo";
import { resetDemoData } from "@/lib/demoReset";

/** Same shape as ExportButton's button, so the pair reads as one control group. */
const btn =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const confirmBtn =
  "rounded-md border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-sm text-red-400 transition-[opacity,transform] duration-150 hover:bg-red-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const cancelBtn =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Demo-only reset control. Renders nothing for any user other than the shared
 * demo account (DEMO_USER_ID) — a conditional return, not CSS, so the button
 * (and the destructive action it gates) is entirely absent from the DOM for
 * every real user. RLS is the real backstop regardless: every delete is
 * scoped to the caller's own rows no matter who could reach this code.
 *
 * On success this reloads the page rather than refetching each section's
 * hook — simpler and a stronger guarantee than threading refetch functions
 * for eight independent hooks through to a header button for a rare,
 * deliberate, demo-only action.
 */
export default function ResetDemoButton() {
  const { session } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "resetting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (session?.user.id !== DEMO_USER_ID) return null;

  async function handleConfirm() {
    setStatus("resetting");
    setError(null);
    const { errors } = await resetDemoData(supabase, DEMO_USER_ID);

    const failed = Object.keys(errors);
    if (failed.length > 0) {
      setStatus("error");
      setError(`Couldn't reset: ${failed.join(", ")}. Some data may remain.`);
      setConfirming(false);
      return;
    }

    window.location.reload();
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-xs text-(--color-text-muted)">
          This erases all demo data. Continue?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={status === "resetting"}
            className={cancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === "resetting"}
            className={confirmBtn}
          >
            {status === "resetting" ? "Resetting…" : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={() => setConfirming(true)} className={btn}>
        Reset demo data
      </button>
      {status === "error" && error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
