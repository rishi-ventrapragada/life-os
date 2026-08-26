"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/**
 * Shared popover-menu shell — mechanics only, no knowledge of its contents.
 * Two menus use it (see components/AccountBlock.tsx): the gear, holding app
 * settings, and the profile avatar, holding the signed-in identity and sign
 * out. Items are passed as children (see components/settings/), so adding one
 * later is "write a component, add one line" rather than a change here.
 *
 * Interaction model is the one already proven in components/ThemeMenu.tsx:
 * pointerdown to close on outside press (menus should close on press, not
 * release), Escape closes and returns focus to the trigger, and Arrow keys
 * cycle the items.
 *
 * Focusable items are found by querying the panel rather than by ref
 * registration. That matters because items render conditionally — ResetDemo
 * returns null for non-demo users, ThemeSetting expands to add rows — and a
 * ref array would need index bookkeeping that the DOM already tracks correctly.
 */
export default function SettingsMenu({
  trigger,
  triggerLabel,
  triggerClassName,
  label,
  open,
  onOpenChange,
  children,
}: {
  /** Trigger content — an icon for the corner buttons. */
  trigger: ReactNode;
  /** Accessible name for the trigger, since the content is an icon. */
  triggerLabel: string;
  /** Trigger styling. Supplied by the caller so one shell serves both buttons. */
  triggerClassName: string;
  /** Accessible name for the panel; distinguishes the two menus. */
  label: string;
  /**
   * Controlled open state. Lifted to the parent because the two corner menus
   * are siblings whose panels overlap each other's trigger — only one may be
   * open at a time, and neither can know about the other from in here.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const setOpen = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      onOpenChange(typeof next === "function" ? next(open) : next);
    },
    [onOpenChange, open],
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(
    (refocus: boolean) => {
      setOpen(false);
      if (refocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

  // Outside press closes. pointerdown rather than click so it closes on press,
  // matching how native menus feel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen]);

  /** Every enabled control inside the panel, in DOM order. */
  function items(): HTMLElement[] {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
    );
  }

  // Move focus into the panel on open so keyboard users land on the first item
  // instead of being stranded on the trigger.
  useEffect(() => {
    if (!open) return;
    // Runs after the panel has painted, so the query sees the rendered rows.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "button:not([disabled])",
    );
    first?.focus();
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close(true);
      return;
    }
    if (!open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;

    event.preventDefault();
    const focusable = items();
    if (focusable.length === 0) return;
    const current = focusable.indexOf(document.activeElement as HTMLElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    // Wraps at both ends; a -1 current (focus outside) enters at the edge.
    const next = (current + step + focusable.length) % focusable.length;
    focusable[next]?.focus();
  }

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          // z-50 clears AccountBlock's md:z-40 and MobileNav's z-30.
          // Anchored to the BOTTOM of the trigger and inset from the left by
          // the button column's width: opening straight up from the lower
          // button would lay the panel across the button above it, making that
          // button unclickable while this one is open (measured: the Account
          // panel covered the gear exactly). Sitting beside the column instead
          // keeps every trigger reachable whichever menu is open.
          // Width is fluidly capped so it still fits a 375px viewport.
          className="absolute bottom-0 left-11 z-50 w-[min(17rem,calc(100vw-4rem))] origin-bottom-left overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-lg transition-[opacity,transform] duration-150 motion-reduce:transition-none"
        >
          {children}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {trigger}
      </button>
    </div>
  );
}
