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
