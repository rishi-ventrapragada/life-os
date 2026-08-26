"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import SettingsMenu from "@/components/settings/SettingsMenu";
import ThemeSetting from "@/components/settings/ThemeSetting";
import ExportSetting from "@/components/settings/ExportSetting";
import ResetDemoSetting from "@/components/settings/ResetDemoSetting";
import SignOutSetting from "@/components/settings/SignOutSetting";
import ProfileIdentity from "@/components/settings/ProfileIdentity";
import { GearIcon, PersonIcon } from "@/components/settings/icons";

/**
 * The two corner controls — a settings gear above a profile avatar — rendered
 * INDEPENDENTLY of the sidebar so they stay reachable at every width. The
 * sidebar is `hidden md:block`, so anything inside it disappears on mobile.
 *
 * Two menus, deliberately separate: the gear holds app settings (theme,
 * export, demo reset) and the avatar answers "which account is this?" plus
 * sign out. Splitting them keeps the destructive/identity action away from the
 * settings the user pokes at routinely.
 *
 * This component owns POSITIONING only; SettingsMenu owns the menu mechanics
 * and each item under components/settings/ owns its own behaviour. Adding a
 * setting later means writing one component and adding one line below.
 *
 * Two layouts, one component:
 * - < md: `static`, rendered in the normal page flow at the end of the content
 *   column (after PomodoroSection) — it scrolls with the page and can never
 *   overlap the fixed MobileNav bar.
 * - md+: `fixed` bottom-left, floating over the page alongside the wheel nav.
 *
 * Both panels open UPWARD (see SettingsMenu), which is what makes the md+
 * bottom-left pinning work. Icon buttons are sized in rem, not fixed pixel
 * containers, and the panels are fluidly capped, so nothing can cause
 * horizontal scroll at 375px.
 *
 * Renders nothing when logged out.
 */

/** Shared trigger shape: a round icon button. */
const TRIGGER =
  "flex size-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface)/95 text-(--color-text-muted) backdrop-blur-sm transition-[opacity,transform] duration-150 motion-reduce:transition-none hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95";

export default function AccountBlock() {
  const { session } = useSession();
  /**
   * Which menu is open, or null. Held here rather than inside each menu
   * because the panels overlap the *other* menu's trigger — with independent
   * state, an open Account panel sits on top of the gear and swallows the
   * click. One open at a time makes both reachable.
   */
  const [openMenu, setOpenMenu] = useState<"settings" | "account" | null>(null);

  if (!session) return null;

  return (
    <div className="static flex flex-col items-start gap-2 md:fixed md:bottom-4 md:left-4 md:z-40">
      <SettingsMenu
        trigger={<GearIcon />}
        triggerLabel="Settings"
        triggerClassName={TRIGGER}
        label="Settings"
        open={openMenu === "settings"}
        onOpenChange={(next) => setOpenMenu(next ? "settings" : null)}
      >
        {/* The settings list. Order is the menu order; each item renders (or
            hides) itself. */}
        <ThemeSetting />
        <ExportSetting />
        <ResetDemoSetting />
      </SettingsMenu>

      <SettingsMenu
        trigger={<PersonIcon />}
        triggerLabel="Account"
        triggerClassName={TRIGGER}
        label="Account"
        open={openMenu === "account"}
        onOpenChange={(next) => setOpenMenu(next ? "account" : null)}
      >
        <ProfileIdentity />
        <SignOutSetting />
      </SettingsMenu>
    </div>
  );
}
