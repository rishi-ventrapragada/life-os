import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local (and Vercel env vars in production).",
  );
}

/**
 * Browser Supabase client (publishable key only — safe client-side).
 * Import from client components / lib modules; one shared instance so the
 * auth session is consistent across the app, on Supabase's default session
 * handling (localStorage + auto-refresh).
 */
export const supabase = createClient(url, anonKey);
