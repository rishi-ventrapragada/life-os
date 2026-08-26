"use client";

import { useSession } from "@/components/auth/SessionProvider";
import SettingsMenu from "@/components/settings/SettingsMenu";
import ThemeSetting from "@/components/settings/ThemeSetting";
import ExportSetting from "@/components/settings/ExportSetting";
import ResetDemoSetting from "@/components/settings/ResetDemoSetting";
import SignOutSetting from "@/components/settings/SignOutSetting";

/**
 * The account control — signed-in identity plus the app's settings menu —
 * rendered INDEPENDENTLY of the sidebar so it stays reachable at every width.
 * The sidebar is `hidden md:block`, so anything inside it disappears on mobile.
 *
 * This component owns POSITIONING only; SettingsMenu owns the menu mechanics
 * and each item under components/settings/ owns its own behaviour. Adding a
 * setting later means writing one component and adding one line to the list
 * below — nothing here or in the shell needs to change.
 *
 * Two layouts, one component:
 * - < md: `static`, full-width, rendered in the normal page flow at the end of
 *   the content column (after PomodoroSection) — it scrolls with the page and
 *   can never overlap the fixed MobileNav bar.
 * - md+: `fixed` bottom-left, fluidly width-capped with min(), floating over
 *   the page alongside the wheel nav.
 *
 * The menu panel opens UPWARD from the trigger (see SettingsMenu), which is
 * what makes the md+ bottom-left pinning work.
 *
 * Renders nothing when logged out. Width is constrained fluidly (min()), never
 * a fixed pixel container, so it can't cause horizontal scroll at 375px.
 */
export default function AccountBlock() {
  const { session } = useSession();

  if (!session) return null;

  return (
    <div className="static w-full rounded-xl border border-(--color-border) bg-(--color-surface)/95 px-4 py-3 backdrop-blur-sm md:fixed md:bottom-4 md:left-4 md:z-40 md:w-[min(16rem,calc(100vw-2rem))]">
      <SettingsMenu
        trigger={
          <span
            className="block truncate text-xs text-(--color-text-muted)"
            title={session.user.email ?? undefined}
          >
            {session.user.email}
          </span>
        }
      >
        {/* The settings list. Order is the menu order; each item renders (or
            hides) itself. */}
        <ThemeSetting />
        <ExportSetting />
        <ResetDemoSetting />
        <SignOutSetting />
      </SettingsMenu>
    </div>
  );
}
