"use client";

import SettingsItem, {
  SettingsGroup,
} from "@/components/settings/SettingsItem";
import { supabase } from "@/lib/supabase";

function SignOutIcon() {
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
      <path d="M15 17v1.5A2.5 2.5 0 0 1 12.5 21h-6A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5V7" />
      <path d="M10 12h10" />
      <path d="m17 9 3 3-3 3" />
    </svg>
  );
}

/** Sign out. onAuthStateChange flips the gate — nothing to do after the call. */
export default function SignOutSetting() {
  return (
    <SettingsGroup>
      <SettingsItem
        icon={<SignOutIcon />}
        label="Sign out"
        onClick={() => void supabase.auth.signOut()}
      />
    </SettingsGroup>
  );
}
