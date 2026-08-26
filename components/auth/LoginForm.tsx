"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { supabase } from "@/lib/supabase";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

type Mode = "signin" | "signup";

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

/** The reveal toggle, centred in the right edge of the password field. */
const revealBtnClass =
  "absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-(--color-text-muted) transition-[opacity,transform] duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-90";

/**
 * Eye / eye-with-slash. `off` means the password is currently VISIBLE, so the
 * struck-through eye is shown — the icon depicts what clicking will do next.
 * aria-hidden because the button's aria-label already carries the meaning.
 */
function EyeIcon({ off }: { off: boolean }) {
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
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  );
}

/**
 * Email/password auth via Supabase Auth only — no hand-rolled hashing, storage,
 * comparison, or reset. Supabase's own error and rate-limit messages are shown
 * verbatim; there is no retry or bypass logic.
 */
export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) setError(signInError.message);
        // On success, onAuthStateChange flips the gate — nothing to do here.
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (!data.session) {
          // Email confirmation is on: no session until the link is clicked.
          setNotice("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } finally {
      setPending(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setNotice(null);
    // Never carry a revealed password across a mode switch.
    setShowPassword(false);
  }

  /**
   * Fills the controlled fields via state, same as typing — never touches the
   * DOM directly. Deliberately does not submit: the visitor sees the demo
   * credentials land in the form and clicks Sign in themselves.
   */
  function fillDemoCredentials() {
    setMode("signin");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setNotice(null);
  }

  return (
    // relative z-10 keeps the login card above the fixed StarField at z-0 —
    // the gate renders this instead of the page, so it needs its own lift.
    <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
            Life OS
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-(--color-text)">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
        </div>

        <GlowCard glow="strong">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
                className={fieldClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
              Password
              {/* relative wrapper so the reveal toggle can sit inside the field;
                  the input reserves pr-10 so typed text never runs under it. */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  className={`${fieldClass} pr-10`}
                />
                <button
                  // type="button" is load-bearing: inside a <form>, a bare
                  // <button> defaults to type="submit" and would sign in.
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className={revealBtnClass}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-(--color-accent-soft)">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full rounded-md border border-(--color-accent) bg-transparent px-4 py-2 text-sm font-medium text-(--color-accent-soft) transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95"
              >
                Try the demo
              </button>
            )}
          </form>
        </GlowCard>

        <p className="mt-6 text-center text-sm text-(--color-text-muted)">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="rounded-sm font-medium text-(--color-accent-soft) transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
