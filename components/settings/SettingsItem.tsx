"use client";

/**
 * Shared presentation primitives for the settings menu.
 *
 * These exist so every item in components/settings/ looks and behaves the same
 * without each one restating the same class string — and so adding a new
 * setting later means writing a component, not editing the menu shell. The
 * shell (SettingsMenu) knows nothing about any specific setting; these are the
 * seam between the two.
 */

import type { ReactNode } from "react";

const ROW_BASE =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-[opacity,transform] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-[0.98]";

const TONE = {
  default: "text-(--color-text-muted) hover:text-(--color-text)",
  danger: "text-red-400 hover:text-red-300",
} as const;

export type SettingsItemProps = {
  /** Leading glyph. Draw it with `stroke="currentColor"` so it follows tone. */
  icon?: ReactNode;
  label: ReactNode;
  /** Right-aligned value or affordance — the current theme name, a chevron. */
  trailing?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: keyof typeof TONE;
  /** Menu semantics; `menuitem` unless the item toggles an expanding group. */
  role?: "menuitem" | "menuitemradio";
  ariaChecked?: boolean;
  ariaExpanded?: boolean;
};

/**
 * One row in the menu. Deliberately a plain forwarded-ref-free button: the
 * shell tracks focusable items by querying the DOM, not by ref registration,
 * so items can be added or conditionally hidden without bookkeeping.
 */
export default function SettingsItem({
  icon,
  label,
  trailing,
  onClick,
  disabled,
  tone = "default",
  role = "menuitem",
  ariaChecked,
  ariaExpanded,
}: SettingsItemProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      disabled={disabled}
      className={`${ROW_BASE} ${TONE[tone]} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing && (
        <span className="shrink-0 text-xs text-(--color-text-muted)">
          {trailing}
        </span>
      )}
    </button>
  );
}

/**
 * A divided run of items. `border-t` on every group but the first gives the
 * menu its sections without any group needing to know its own position.
 */
export function SettingsGroup({
  children,
  ref,
}: {
  children: ReactNode;
  /** React 19 passes ref as a normal prop — no forwardRef wrapper needed. */
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className="flex flex-col border-t border-(--color-border) py-1 first:border-t-0"
    >
      {children}
    </div>
  );
}

/** Secondary text under an item — helper copy, inline errors, confirmations. */
export function SettingsNote({
  children,
  tone = "muted",
  role,
}: {
  children: ReactNode;
  tone?: "muted" | "error";
  role?: "alert" | "status";
}) {
  return (
    <p
      role={role}
      className={`px-3 pb-1 text-xs leading-relaxed ${
        tone === "error" ? "text-red-400" : "text-(--color-text-muted)"
      }`}
    >
      {children}
    </p>
  );
}
