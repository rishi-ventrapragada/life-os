"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { collectExport } from "@/lib/exportData";
import { getTodayIST } from "@/lib/dates";

const btn =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Downloads all of the signed-in user's data as one JSON file. Reads go through
 * the shared anon-key client under RLS (lib/exportData), so the file can only ever
 * contain the owner's own rows — no service key, no server endpoint.
 */
export default function ExportButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      const { data, errors } = await collectExport(supabase);

      const failed = Object.keys(errors);
      if (failed.length > 0) {
        setError(`Couldn't export: ${failed.join(", ")}. Nothing was downloaded.`);
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
    } catch {
      setError("Couldn't export your data. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={handleExport} disabled={busy} className={btn}>
        {busy ? "Exporting…" : "↓ Export my data"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
