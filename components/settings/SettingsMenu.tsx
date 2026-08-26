"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The account/settings menu shell — mechanics only, no knowledge of any
 * individual setting. Items are passed as children (see components/settings/),
 * so adding a setting later is "write a component, add one line" rather than a
 * change here.
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
  /** Trigger content: the signed-in identity. Rendered inside the button. */
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Outside press closes. pointerdown rather than click so it closes on press,
  // matching how native menus feel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

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
          aria-label="Settings"
          // Opens UPWARD (bottom-full): at md+ this block is pinned to the
          // bottom-left of the viewport, so downward would render offscreen.
          // Fluid min() width (Law 5) keeps it inside a 375px viewport.
          // z-50 clears AccountBlock's md:z-40 and MobileNav's z-30.
          className="absolute bottom-full left-0 z-50 mb-2 w-[min(18rem,calc(100vw-2rem))] origin-bottom-left overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-lg transition-[opacity,transform] duration-150 motion-reduce:transition-none"
        >
          {children}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-[opacity,transform] duration-150 motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1">{trigger}</span>
        {/* Chevron points the way the panel opens, and flips once it is open. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-4 shrink-0 text-(--color-text-muted) transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}
