// Local-timezone ISO date helpers. We key availability by `YYYY-MM-DD` in the
// user's local day (the snapshot dates are calendar dates, no time component),
// so we format/parse against local midnight — never toISOString(), which would
// shift the day backward in US timezones.

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toISO(d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

const MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jun 23" — short and clear, no weekday.
export function prettyISO(iso: string): string {
  const d = fromISO(iso);
  return `${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
}
