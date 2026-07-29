"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
};

/** Same shape as ExportButton's button, so the pair reads as one control group. */
const TRIGGER =
  "rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95";

/**
 * The <html> attribute is the primary source, not localStorage: the
 * before-paint script has already resolved storage into it, so it is the live
 * truth. Storage is the fallback, covering the default case where no attribute
 * is ever stamped.
 */
function readActiveTheme(): Theme {
  if (document.documentElement.getAttribute("data-theme") === "mono") return "mono";
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

/**
 * Theme switcher: an icon button opening a small menu of the available themes.
 *
 * Applying and persisting go through lib/theme.ts (applyTheme + the storage
 * key), which is the same behaviour the boot script implements, so a choice
 * made here survives a reload without the two definitions drifting.
 */
export default function ThemeMenu() {
  // getServerSnapshot (3rd arg) returns the default so SSR and the first client
  // render agree; the subscription then reports what is actually on <html>.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readActiveTheme,
    () => DEFAULT_THEME,
  );
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Outside click. pointerdown rather than click so the menu closes on press,
  // matching how native menus feel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus onto the active item when the menu opens, so keyboard users land
  // somewhere meaningful instead of at the top of the list.
  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, THEMES.indexOf(theme));
    itemRefs.current[index]?.focus();
  }, [open, theme]);

  function select(next: Theme) {
    // No setState here: applyTheme mutates <html>, the MutationObserver above
    // sees it, and useSyncExternalStore re-reads. One source of truth.
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persisting failed; the theme still applies for this session.
    }
    close(true);
  }

  /** Escape closes from anywhere inside; arrows cycle the items. */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close(true);
      return;
    }
    if (!open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;

    event.preventDefault();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + step + THEMES.length) % THEMES.length;
    itemRefs.current[next]?.focus();
  }

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className={TRIGGER}
      >
        {/* Palette glyph. currentColor so it follows the button's text colour
            through a theme change; aria-hidden since the label carries meaning. */}
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
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          // Right-aligned so the panel can never overflow the viewport edge on a
          // narrow screen. Motion is opacity + transform only, and reduced-motion
          // users get it present without the animation.
          className="absolute right-0 z-40 mt-2 w-44 origin-top-right rounded-md border border-(--color-border) bg-(--color-surface) p-1 shadow-lg transition-[opacity,transform] duration-150 motion-reduce:transition-none"
        >
          {THEMES.map((option, index) => {
            const active = option === theme;
            return (
              <button
                key={option}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => select(option)}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-[opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 ${
                  active
                    ? "bg-(--color-accent)/15 text-(--color-accent-soft)"
                    : "text-(--color-text-muted) hover:text-(--color-text)"
                }`}
              >
                {LABELS[option]}
                {/* A glyph, not colour alone, so the active theme is legible
                    without relying on colour perception. */}
                <span aria-hidden="true">{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
