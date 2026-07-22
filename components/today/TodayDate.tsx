import { getTodayIST } from "@/lib/dates";
import { WEEKDAYS } from "@/lib/weekdays";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Today's IST date (PRD §4.1a). The weekday comes from Date.UTC on the split
 * parts — a UTC instant built from the already-correct IST calendar date, so
 * no local-time parsing and no second clock (Architecture Law 3).
 */
export default function TodayDate() {
  const today = getTodayIST();
  const [y, m, d] = today.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  return (
    <p className="font-display text-sm uppercase tracking-[0.2em] text-(--color-accent-soft)">
      {weekday}, {d} {MONTHS[m - 1]} {y}
    </p>
  );
}
