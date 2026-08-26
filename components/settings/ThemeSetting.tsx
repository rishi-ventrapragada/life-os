"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import SettingsItem, {
  SettingsGroup,
} from "@/components/settings/SettingsItem";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  type Theme,
} from "@/lib/theme";

const LABELS: Record<Theme, string> = {
  amethyst: "Amethyst",
  mono: "Monochrome",
  crimson: "Crimson",
};

/**
 * The <html> attribute is the primary source, not localStorage: the
 * before-paint script has already resolved storage into it, so it is the live
 * truth. Storage is the fallback, covering the default case where no attribute
 * is ever stamped.
 */
function readActiveTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage disabled (Safari private mode) — the default is still correct.
  }
  return DEFAULT_THEME;
}

/**
 * The theme lives on <html>, outside React, so it is read with
 * useSyncExternalStore rather than mirrored into state by an effect (which
 * React 19's lint correctly rejects as a cascading render). A MutationObserver
 * on the attribute keeps this in step with any change — including one made by
 * the boot script or another component — instead of only the ones made here.
 */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function PaletteIcon() {
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
      <path d="M12 3a9 9 0 1 0 0 18 2.5 2.5 0 0 0 1.8-4.2 2.5 2.5 0 0 1 1.8-4.3H18a3 3 0 0 0 3-3 9 9 0 0 0-9-6.5Z" />
      <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Theme picker as an in-menu expanding group: a "Theme" row showing the active
 * palette, which expands to the full list in place rather than opening a nested
 * popover (a submenu inside an already-floating panel is hard to keep on-screen
 * at 375px).
 *
 * Applying and persisting go through lib/theme.ts, the same behaviour the
 * before-paint script implements, so a choice made here survives a reload
 * without the two definitions drifting.
 */
export default function ThemeSetting() {
  // getServerSnapshot (3rd arg) returns the default so SSR and the first client
  // render agree; the subscription then reports what is actually on <html>.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readActiveTheme,
    () => DEFAULT_THEME,
  );
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  function select(next: Theme) {
    // No setState here: applyTheme mutates <html>, the MutationObserver above
    // sees it, and useSyncExternalStore re-reads. One source of truth.
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persisting failed; the theme still applies for this session.
    }
    setExpanded(false);
    // The clicked option unmounts as the group collapses. Without this, focus
    // falls back to <body>, which is OUTSIDE the menu's React subtree — so the
    // shell's onKeyDown (a delegated listener) would stop receiving Escape and
    // the menu could no longer be closed by keyboard. Move focus to the Theme
    // row, which survives the collapse.
    rowRef.current?.querySelector("button")?.focus();
  }

  return (
    <SettingsGroup ref={rowRef}>
      <SettingsItem
        icon={<PaletteIcon />}
        label="Theme"
        trailing={`${LABELS[theme]} ${expanded ? "▴" : "▾"}`}
        ariaExpanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      />
      {expanded &&
        THEMES.map((option) => {
          const active = option === theme;
          return (
            <SettingsItem
              key={option}
              role="menuitemradio"
              ariaChecked={active}
              onClick={() => select(option)}
              // Indented so the list reads as belonging to the Theme row above.
              label={
                <span
                  className={`pl-7 ${active ? "text-(--color-accent-soft)" : ""}`}
                >
                  {LABELS[option]}
                </span>
              }
              // A glyph, not colour alone, so the active theme is legible
              // without relying on colour perception.
              trailing={active ? "✓" : ""}
            />
          );
        })}
    </SettingsGroup>
  );
}
