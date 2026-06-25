// One-line opening-hours summary in the North-American listing style
// (Google/Yelp/OTA conventions): "Open daily 9am–5pm", "Mon–Fri 9am–5pm ·
// Sat–Sun 10am–6pm", "9am–4pm · closed Tue". Never the raw per-day dump.
export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const DAY_ABBR: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export function summarizeHours(hours?: Record<string, string> | null): string | null {
  if (!hours) return null;
  const ranges = DAYS.map((d) => formatHoursRange(hours[d]));
  const openIdx = ranges.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
  if (!openIdx.length) return null;
  const closed = DAYS.filter((_, i) => !ranges[i]);

  const openVals = openIdx.map((i) => ranges[i]!);
  const allSame = new Set(openVals).size === 1;

  // every open day shares one schedule
  if (allSame) {
    const h = openVals[0];
    if (!closed.length) return `Open daily ${h}`;
    if (closed.length <= 2) return `${h} · closed ${closed.map((d) => DAY_ABBR[d]).join(" & ")}`;
    return `${dayList(openIdx)} ${h}`;
  }

  // weekday / weekend split
  const wd = [0, 1, 2, 3, 4].map((i) => ranges[i]);
  const we = [5, 6].map((i) => ranges[i]);
  if (wd.every((x) => x && x === wd[0]) && we.every((x) => x && x === we[0])) {
    return `Mon–Fri ${wd[0]} · Sat–Sun ${we[0]}`;
  }

  // general: group consecutive days that share a schedule
  const segs: string[] = [];
  let i = 0;
  while (i < 7) {
    if (!ranges[i]) { i++; continue; }
    let j = i;
    while (j + 1 < 7 && ranges[j + 1] === ranges[i]) j++;
    const span = i === j ? DAY_ABBR[DAYS[i]] : `${DAY_ABBR[DAYS[i]]}–${DAY_ABBR[DAYS[j]]}`;
    segs.push(`${span} ${ranges[i]}`);
    i = j + 1;
  }
  return segs.join(" · ");
}

function dayList(idx: number[]): string {
  return idx.map((i) => DAY_ABBR[DAYS[i]]).join(", ");
}

// "10:00-17:00" → "10am–5pm"; missing / "closed" / unparseable → null.
export function formatHoursRange(v?: string): string | null {
  if (!v) return null;
  const m = v.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null; // "closed" or unparseable
  return `${t(+m[1], +m[2])}–${t(+m[3], +m[4])}`;
}

function t(h: number, m: number): string {
  const ap = h >= 12 ? "pm" : "am";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return m ? `${hh}:${String(m).padStart(2, "0")}${ap}` : `${hh}${ap}`;
}
