"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { supabase } from "@/lib/supabase";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

type Mode = "signin" | "signup";

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

/**
 * Email/password auth via Supabase Auth only — no hand-rolled hashing, storage,
 * comparison, or reset. Supabase's own error and rate-limit messages are shown
 * verbatim; there is no retry or bypass logic.
 */
export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                className={fieldClass}
              />
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
