"use client";

import { useState } from "react";
import SettingsItem, {
  SettingsGroup,
  SettingsNote,
} from "@/components/settings/SettingsItem";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/demo";
import { resetDemoData } from "@/lib/demoReset";

function ResetIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

/**
 * Demo-only reset control. Renders nothing for any user other than the shared
 * demo account (DEMO_USER_ID) — a conditional return, not CSS, so the button
 * (and the destructive action it gates) is entirely absent from the DOM for
 * every real user. RLS is the real backstop regardless: every delete is
 * scoped to the caller's own rows no matter who could reach this code.
 *
 * On success this reloads the page rather than refetching each section's
 * hook — simpler and a stronger guarantee than threading refetch functions
 * for eight independent hooks through to a menu item for a rare, deliberate,
 * demo-only action.
 */
export default function ResetDemoSetting() {
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
      <SettingsGroup>
        <SettingsNote>This erases all demo data. Continue?</SettingsNote>
        <SettingsItem
          label="Cancel"
          onClick={() => setConfirming(false)}
          disabled={status === "resetting"}
        />
        <SettingsItem
          tone="danger"
          label={status === "resetting" ? "Resetting…" : "Yes, erase it"}
          onClick={handleConfirm}
          disabled={status === "resetting"}
        />
      </SettingsGroup>
    );
  }

  return (
    <SettingsGroup>
      <SettingsItem
        icon={<ResetIcon />}
        label="Reset demo data"
        onClick={() => setConfirming(true)}
      />
      {status === "error" && error && (
        <SettingsNote tone="error" role="alert">
          {error}
        </SettingsNote>
      )}
    </SettingsGroup>
  );
}
