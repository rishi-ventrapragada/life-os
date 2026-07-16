/**
 * The five fixed life areas. Local constant until Step 5 seeds them into
 * Supabase per-user; Habits and Tasks will reuse this in later steps.
 */
export const LIFE_AREAS = [
  "Academics",
  "Fitness",
  "Coding",
  "Content Creation",
  "Personal Finance",
] as const;

export type LifeArea = (typeof LIFE_AREAS)[number];
