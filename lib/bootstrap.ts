import { supabase } from "@/lib/supabase";
import { LIFE_AREAS } from "@/lib/lifeAreas";

export type Bootstrap = {
  userId: string;
  /** life_area name → row id for the signed-in user. */
  areaIdByName: Record<string, string>;
};

/**
 * Cached per user id. Two reasons the cache is keyed by user rather than a bare
 * singleton: React StrictMode double-mounts effects in dev (a bare guard stops
 * the seed running twice for one login), and a sign-out → sign-in as a
 * different account in the same page load must NOT hand the new user the
 * previous user's area ids — a mismatched key rebuilds instead.
 */
let cached: { userId: string; promise: Promise<Bootstrap> } | null = null;

/**
 * Idempotent 5-area seed, fired on first real login/sign-up (the login gate
 * guarantees a session before any caller reaches here — anonymous sign-in was
 * removed in Step 5). Safe to call on every render; it resolves to the same
 * promise per user.
 */
export function ensureAreasSeeded(userId: string): Promise<Bootstrap> {
  if (cached?.userId !== userId) {
    cached = {
      userId,
      promise: doBootstrap(userId).catch((err) => {
        cached = null; // failed runs don't poison later retries
        throw err;
      }),
    };
  }
  return cached.promise;
}

async function doBootstrap(userId: string): Promise<Bootstrap> {
  // Idempotent: unique(user_id, name) + DO NOTHING makes re-runs no-ops.
  // user_id is filled by the column default auth.uid(), so RLS scopes the
  // seed to whoever is actually authenticated.
  const { error: seedError } = await supabase.from("life_areas").upsert(
    LIFE_AREAS.map((name, i) => ({ name, sort_order: i })),
    { onConflict: "user_id,name", ignoreDuplicates: true },
  );
  if (seedError) throw seedError;

  const { data: areas, error: areasError } = await supabase
    .from("life_areas")
    .select("id,name");
  if (areasError) throw areasError;

  return {
    userId,
    areaIdByName: Object.fromEntries(areas.map((a) => [a.name, a.id])),
  };
}
