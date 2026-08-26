"use client";

import { useState } from "react";
import SettingsItem, {
  SettingsGroup,
  SettingsNote,
} from "@/components/settings/SettingsItem";
import { supabase } from "@/lib/supabase";
import { collectExport } from "@/lib/exportData";
import { getTodayIST } from "@/lib/dates";

function DownloadIcon() {
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
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

/**
 * Downloads all of the signed-in user's data as one JSON file. Reads go through
 * the shared anon-key client under RLS (lib/exportData), so the file can only
 * ever contain the owner's own rows — no service key, no server endpoint.
 *
 * The hint line under the button is deliberate: a .json file opened in Notepad
 * looks like "random code" to a non-developer, which has already been mistaken
 * for a bug once. The file is correct; the hint says where to open it.
 */
export default function ExportSetting() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleExport() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const { data, errors } = await collectExport(supabase);

      const failed = Object.keys(errors);
      if (failed.length > 0) {
        setError(
          `Couldn't export: ${failed.join(", ")}. Nothing was downloaded.`,
        );
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-os-export-${getTodayIST()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Couldn't export your data. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsGroup>
      <SettingsItem
        icon={<DownloadIcon />}
        label={busy ? "Exporting…" : "Export my data"}
        onClick={handleExport}
        disabled={busy}
      />
      {error ? (
        <SettingsNote tone="error" role="alert">
          {error}
        </SettingsNote>
      ) : (
        <SettingsNote role={done ? "status" : undefined}>
          {done
            ? "Downloaded. It's a .json file — open it in your browser or VS Code to read it."
            : "Everything you've saved, as one .json file."}
        </SettingsNote>
      )}
    </SettingsGroup>
  );
}
