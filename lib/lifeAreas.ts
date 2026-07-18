/**
 * The five fixed life areas. Seeded into Supabase per-user on first login
 * (see lib/bootstrap.ts); Habits and Tasks will reuse this in later steps.
 */
export const LIFE_AREAS = [
  "Academics",
  "Fitness",
  "Coding",
  "Content Creation",
  "Personal Finance",
] as const;

export type LifeArea = (typeof LIFE_AREAS)[number];
