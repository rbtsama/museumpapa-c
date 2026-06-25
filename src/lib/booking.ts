import type { Pass } from "../data/types";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Turn a pass's generic booking page into the chosen day's reservation page when
// the platform supports it, so tapping Book lands the user where the date is
// already selected and they can go straight to entering their card — instead of
// a month grid they have to pick a day from again.
//
// Assabet pass pages expose a per-day URL:
//   .../museum-passes/by-museum/<slug>/
//      → .../museum-passes/by-date/<YYYY>-<month>/<D>/<slug>/
// (observed live, e.g. .../by-date/2026-may/20/boston-childrens-museum/).
// Other platforms (LibCal, whofi, …) have no public per-date deep-link, so we
// return their page unchanged.
export function bookingUrl(pass: Pass, dateISO?: string): string {
  const url = pass.source_url || "";
  if (!dateISO || !url.includes("/by-museum/")) return url;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) return url;
  const [, y, mo, d] = m;
  const month = MONTHS[parseInt(mo, 10) - 1];
  const day = String(parseInt(d, 10)); // no leading zero, matches live URLs
  return url.replace("/by-museum/", `/by-date/${y}-${month}/${day}/`);
}
