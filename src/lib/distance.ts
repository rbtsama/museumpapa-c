import type { Geo } from "../data/types";

// Straight-line distance in miles (haversine). Mirrors the backend's
// common.geocode.haversine_miles so the C-side shows the same numbers.
export function miles(a?: Geo, b?: Geo): number | null {
  if (!a || !b) return null;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
