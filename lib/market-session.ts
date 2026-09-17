// Works out which trading session a timestamp falls in.
// The time is interpreted in `zone` (e.g. your broker's server time or your local time),
// then checked against each market's local opening hours, so DST is handled automatically.

const MARKETS = [
  { name: "Sydney", zone: "Australia/Sydney", open: 7, close: 16 },
  { name: "Tokyo", zone: "Asia/Tokyo", open: 9, close: 18 },
  { name: "London", zone: "Europe/London", open: 8, close: 17 },
  { name: "New York", zone: "America/New_York", open: 8, close: 17 },
];

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "UTC", label: "UTC" },
  { value: "Etc/GMT-2", label: "Broker server UTC+2" },
  { value: "Etc/GMT-3", label: "Broker server UTC+3" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
];

function offsetMinutes(instant: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant) / 60000);
}

/** Converts a wall-clock date/time in `zone` into a UTC timestamp. */
export function zonedToUtc(date: string, time: string, zone: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})/.exec(time);
  if (!d || !t) return null;
  try {
    const naive = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
    let utc = naive - offsetMinutes(naive, zone) * 60000;
    utc = naive - offsetMinutes(utc, zone) * 60000; // second pass fixes DST edges
    return utc;
  } catch {
    return null; // invalid time zone
  }
}

function localHour(instant: number, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23", hour: "2-digit", minute: "2-digit", weekday: "short",
  }).formatToParts(new Date(instant));
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return { hour: h + m / 60, weekend: weekday === "Sat" || weekday === "Sun" };
}

export function deriveSession(date: string, time: string, zone: string): string {
  const utc = zonedToUtc(date, time, zone);
  if (utc === null) return "";
  const open = MARKETS.filter((mk) => {
    const { hour, weekend } = localHour(utc, mk.zone);
    return !weekend && hour >= mk.open && hour < mk.close;
  }).map((mk) => mk.name);
  // Sydney is only reported when nothing else is open, to keep labels short.
  const main = open.filter((n) => n !== "Sydney");
  if (main.length) return main.join(" / ");
  return open.length ? "Sydney" : "Off-hours";
}
