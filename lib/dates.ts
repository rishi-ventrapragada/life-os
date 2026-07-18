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
