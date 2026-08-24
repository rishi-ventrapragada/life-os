const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a stored "yyyy-mm-dd" string for display (e.g. "5 Jul 2026"). A pure
 * string split — no Date objects, so no timezone can shift the day
 * (Architecture Law 3). Shared by Tasks, Today and Journal instead of a copy
 * per section.
 */
export function formatISODate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? "?"} ${y}`;
}

/**
 * Same date, shortened for labels that sit next to a "when" badge (e.g. the
 * Distant due tier): "14 Aug" within the current year, "14 Aug 2027" outside
 * it. Dropping the year unconditionally would make a date 14 months out read
 * as if it had already passed, so the year comes back exactly when it
 * disambiguates.
 *
 * `today` is a parameter, not a getTodayIST() call, so this stays pure and the
 * year boundary is testable. Comparing the year substrings keeps it a string
 * split like formatISODate — no Date objects, so no timezone can shift the day
 * (Architecture Law 3).
 *
 * Archives (Journal, Fitness) deliberately keep formatISODate: their lists are
 * unbounded and reverse-chronological, so the year there is load-bearing.
 */
export function formatISODateShort(iso: string, today: string): string {
  const [y, m, d] = iso.split("-");
  const short = `${Number(d)} ${MONTHS[Number(m) - 1] ?? "?"}`;
  return y === today.split("-")[0] ? short : `${short} ${y}`;
}

/**
 * Format a "yyyy-mm" month key for a section heading (e.g. "August 2026").
 * Full month name, unlike the 3-letter form above — a heading has room and
 * reads better spelled out. Pure string split, same reasoning as formatISODate.
 */
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return `${FULL_MONTHS[Number(m) - 1] ?? "?"} ${y}`;
}
