import type { LifeArea } from "@/lib/lifeAreas";

/**
 * Mirrors the PRD draft schema for the `goals` table (minus user_id, which
 * arrives with auth) so Step 3 can wire persistence without renames.
 */
export type Goal = {
  id: string;
  title: string;
  area: LifeArea;
  /** "yyyy-mm-dd" from the date input. Display only until Step 4. */
  deadline: string | null;
  /** 0–100, set manually by the owner. */
  progress: number;
};
