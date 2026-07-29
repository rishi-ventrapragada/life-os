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

export const THEMES = ["amethyst", "mono"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "amethyst";

/** Narrows an unknown stored value; anything unrecognised is not a theme. */
export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Applies a theme to <html> the same way the before-paint script does: mono
 * stamps the attribute, amethyst removes it. Kept here so the runtime switcher
 * and the boot script stay one behaviour, not two.
 */
export function applyTheme(theme: Theme) {
  if (theme === "mono") {
    document.documentElement.setAttribute("data-theme", "mono");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
