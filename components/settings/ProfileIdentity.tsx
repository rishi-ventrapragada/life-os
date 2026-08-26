"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { SettingsGroup } from "@/components/settings/SettingsItem";

/**
 * The "which account am I signed in with?" block at the top of the profile
 * menu. Read-only, so it is not a menu item — the shell's arrow-key cycling
 * only walks buttons, and this deliberately isn't one.
 *
 * The email is the answer to the question the menu exists to answer, so it
 * wraps (break-all) instead of truncating: a clipped address that ends in "…"
 * would defeat the point at the narrow widths this panel is capped to.
 */
export default function ProfileIdentity() {
  const { session } = useSession();
  const email = session?.user.email;

  return (
    <SettingsGroup>
      <div className="px-3 py-2">
        <p className="text-[0.7rem] uppercase tracking-[0.15em] text-(--color-text-muted)">
          Signed in as
        </p>
        <p className="mt-1 break-all text-sm text-(--color-text)">
          {email ?? "Unknown account"}
        </p>
      </div>
    </SettingsGroup>
  );
}
