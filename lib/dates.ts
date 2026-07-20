/**
 * The one clock the app has (Architecture Law 3). Returns the calendar date in
 * Asia/Kolkata as "yyyy-mm-dd". IST is a constant UTC+5:30 (no DST since 1945),
 * so IST midnight = 18:30 UTC the previous day. Pass `now` to test a fixed instant.
 */
const IST_DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayIST(now: Date = new Date()): string {
  // Read the wall-clock date in Asia/Kolkata, then assemble from parts so the
  // output order/separator never depends on the runtime's default locale.
  const parts = IST_DATE_PARTS.formatToParts(now);
  const pick = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

const MS_PER_DAY = 86_400_000;

/**
 * "yyyy-mm-dd" -> UTC epoch ms at midnight. Splits the string and goes through
 * Date.UTC rather than `new Date(str)`: string parsing is inconsistent across
 * formats (bare dates are UTC, date-times are local), and any local-time path
 * would make these helpers wrong in some timezones. Nothing here reads a clock.
 */
function toUTCms(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTCms(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Step `date` by `n` calendar days (negative goes backwards), returning
 * "yyyy-mm-dd". Leap years and month lengths are handled by Date.UTC itself,
 * so there is no month-length table to get wrong.
 */
export function addDaysISO(date: string, n: number): string {
  return fromUTCms(toUTCms(date) + n * MS_PER_DAY);
}

/**
 * Whole days from `b` to `a` — positive when `a` is the later date. Both ends
 * are UTC midnights, so the difference is always an exact multiple of a day
 * (no DST, no fractional days).
 */
export function diffDaysISO(a: string, b: string): number {
  return (toUTCms(a) - toUTCms(b)) / MS_PER_DAY;
}
