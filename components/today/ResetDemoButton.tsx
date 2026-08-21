"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { DEMO_USER_ID } from "@/lib/demo";

/** Same shape as ExportButton's button, so the pair reads as one control group. */
const btn =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const confirmBtn =
  "rounded-md border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-sm text-red-400 transition-[opacity,transform] duration-150 hover:bg-red-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95";

const cancelBtn =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95";

/**
 * Demo-only reset control. Renders nothing for any user other than the shared
 * demo account (DEMO_USER_ID) — a conditional return, not CSS, so the button
 * (and the destructive action it gates) is entirely absent from the DOM for
 * every real user.
 *
 * Increment 1: gate + confirmation flow only. Confirming logs and closes —
 * no delete logic yet (that's increment 2).
 */
export default function ResetDemoButton() {
  const { session } = useSession();
  const [confirming, setConfirming] = useState(false);

  if (session?.user.id !== DEMO_USER_ID) return null;

  function handleConfirm() {
    console.log("reset confirmed — delete logic added in increment 2");
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-xs text-(--color-text-muted)">
          This erases all demo data. Continue?
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setConfirming(false)} className={cancelBtn}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className={confirmBtn}>
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={btn}>
      Reset demo data
    </button>
  );
}
