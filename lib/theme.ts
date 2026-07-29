/**
 * Theme identity — shared by the before-paint script in app/layout.tsx and (from
 * increment 4) the theme switcher, so the two cannot drift apart.
 *
 * "amethyst" is the default and is represented by the ABSENCE of the data-theme
 * attribute: globals.css defines amethyst as the base cascade and only
 * [data-theme="mono"] overrides it. So stamping data-theme="amethyst" would be
 * a no-op, and the script deliberately never writes it.
 */

export const THEME_STORAGE_KEY = "theme";

export const THEMES = ["amethyst", "mono", "crimson"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "amethyst";

/** Narrows an unknown stored value; anything unrecognised is not a theme. */
export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Applies a theme to <html> the same way the before-paint script does: every
 * non-default theme stamps its own name, and the default removes the attribute
 * entirely. Kept here so the runtime switcher and the boot script stay one
 * behaviour, not two.
 *
 * Deliberately keyed off DEFAULT_THEME rather than naming a theme, so adding a
 * fourth palette needs no change here — only THEMES, the CSS block, and the
 * boot script's allow-list.
 */
export function applyTheme(theme: Theme) {
  if (theme === DEFAULT_THEME) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}
