import { supabase } from "@/lib/supabase";
import { LIFE_AREAS } from "@/lib/lifeAreas";

export type Bootstrap = {
  userId: string;
  /** life_area name → row id for the signed-in user. */
  areaIdByName: Record<string, string>;
};

let bootstrapPromise: Promise<Bootstrap> | null = null;

/**
 * Session + life-area seed, exactly once per page load. The shared promise
 * matters: React StrictMode double-mounts effects in dev, and two concurrent
 * runs would mint two anonymous users. Anonymous sign-in bridges the auth gap
 * until Step 5's real login (same user id after conversion, no migration).
 */
export function ensureSessionAndAreas(): Promise<Bootstrap> {
  bootstrapPromise ??= doBootstrap().catch((err) => {
    bootstrapPromise = null; // failed runs don't poison later retries
    throw err;
  });
  return bootstrapPromise;
}

async function doBootstrap(): Promise<Bootstrap> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let userId = sessionData.session?.user.id;
  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      throw error ?? new Error("Anonymous sign-in returned no user");
    }
    userId = data.user.id;
  }

  // Idempotent: unique(user_id, name) + DO NOTHING makes re-runs no-ops.
  // user_id is filled by the column default auth.uid().
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
