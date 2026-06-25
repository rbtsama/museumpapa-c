import { useState } from "react";
import type { AvailStatus } from "../lib/supply";
import { toISO } from "../lib/dates";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MON = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const dayKey = (d: Date) => d.getFullYear() * 1e4 + d.getMonth() * 100 + d.getDate();

// booked / closed / unavailable → can't book that day.
const isBlocked = (s: AvailStatus | undefined) =>
  s === "booked" || s === "closed" || s === "unavailable";

// A self-contained month grid coloured by inventory: green dot = available,
// amber = limited, blocked days dimmed & unclickable. Shared by the bottom-sheet
// picker (CalendarSheet) and the attraction detail page (inline).
export function MonthCalendar({
  min,
  max,
  value,
  statusFor,
  onSelect,
  legend = true,
}: {
  min: Date;
  max: Date;
  value: Date | null;
  statusFor?: (iso: string) => AvailStatus;
  onSelect: (d: Date) => void;
  legend?: boolean;
}) {
  const [view, setView] = useState(() => startOfMonth(value ?? min));

  const lead = startOfMonth(view).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1)),
  ];
  const canPrev = startOfMonth(view) > startOfMonth(min);
  const canNext = startOfMonth(view) < startOfMonth(max);
  const inRange = (d: Date) => dayKey(d) >= dayKey(min) && dayKey(d) <= dayKey(max);
  const shift = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-1">
        <button disabled={!canPrev} onClick={() => shift(-1)} className="grid h-9 w-9 place-items-center rounded-full text-ink disabled:opacity-25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <span className="font-display text-[16px] font-semibold text-ink">{MON[view.getMonth()]} {view.getFullYear()}</span>
        <button disabled={!canNext} onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-full text-ink disabled:opacity-25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-ink-faint">
        {DOW.map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d == null) return <span key={i} />;
          const within = inRange(d);
          const st = within && statusFor ? statusFor(toISO(d)) : undefined;
          const blocked = isBlocked(st);
          const selectable = within && !blocked;
          const selected = value && dayKey(value) === dayKey(d);
          const dot = st === "available" ? "#2f9163" : st === "limited" ? "#c2691a" : null;
          return (
            <button
              key={i}
              disabled={!selectable}
              onClick={() => onSelect(d)}
              className={
                "flex aspect-square flex-col items-center justify-center rounded-[10px] text-[14px] transition " +
                (selected
                  ? "bg-brand font-bold text-white"
                  : !within
                    ? "text-ink-faint/30"
                    : blocked
                      ? "text-ink-faint/50 " + (st === "closed" ? "line-through" : "")
                      : "text-ink hover:bg-brand/10")
              }
            >
              <span className="leading-none">{d.getDate()}</span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                style={{ background: !selected && dot ? dot : "transparent" }}
              />
            </button>
          );
        })}
      </div>

      {legend && statusFor && (
        <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-ink-faint">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: "#2f9163" }} />Available</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: "#c2691a" }} />Limited</span>
        </div>
      )}
    </div>
  );
}
