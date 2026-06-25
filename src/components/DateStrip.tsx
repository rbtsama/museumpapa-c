import { useMemo, useState } from "react";
import { CalendarSheet } from "./CalendarSheet";
import { addDaysISO, fromISO, todayISO, toISO } from "../lib/dates";

// Date picker (controlled): Any day · Today + next 4 · Pick. Choosing "Any day"
// dims the days + Pick (still tappable — tap any of them, or Any day again, to
// leave Any-day mode). The Pick calendar here is a PLAIN date filter (no per-pass
// availability colouring — that belongs on a specific attraction, not the list).
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DateStrip({
  value,
  onChange,
  flexible = false,
  onFlexibleToggle,
}: {
  value: string; // selected ISO date
  onChange: (iso: string) => void;
  flexible?: boolean; // "Any day" — list everything, no date filter
  onFlexibleToggle?: () => void;
}) {
  const [sheet, setSheet] = useState(false);

  const { days, min, max } = useMemo(() => {
    const t = todayISO();
    const td = fromISO(t);
    const days = Array.from({ length: 5 }, (_, i) => addDaysISO(t, i));
    // selectable window is the next two months (plain filter, no inventory)
    const max = new Date(td.getFullYear(), td.getMonth() + 2, td.getDate());
    return { days, min: td, max };
  }, []);

  const isQuickDay = days.includes(value);
  const customDate = fromISO(value);
  const pickActive = !flexible && !isQuickDay;

  return (
    <div>
      <div className="px-4 pt-1.5 text-[12px] font-medium text-ink-soft">Get your pass</div>

      <div className="flex items-stretch gap-2 px-4 pb-2.5 pt-1">
        {/* Any day — first */}
        {onFlexibleToggle && (
          <button
            onClick={onFlexibleToggle}
            className={
              "flex shrink-0 flex-col items-center justify-center rounded-[10px] border px-2.5 py-1.5 transition " +
              (flexible ? "border-brand bg-brand text-white" : "border-[#ece2d6] bg-white text-ink")
            }
          >
            <span className="text-[12px] font-bold leading-tight">Any</span>
            <span className="text-[12px] font-bold leading-tight">day</span>
          </button>
        )}

        {/* 5 days + Pick — dimmed (but still tappable) while Any-day is on */}
        <div className={"flex flex-1 items-stretch gap-2 transition " + (flexible ? "opacity-40" : "")}>
          {days.map((iso, i) => {
            const on = !flexible && value === iso;
            const d = fromISO(iso);
            return (
              <button
                key={iso}
                onClick={() => onChange(iso)}
                className={
                  "relative flex flex-1 flex-col items-center justify-center rounded-[10px] border px-1 py-1.5 transition " +
                  (on ? "border-brand bg-brand text-white" : "border-[#ece2d6] bg-white text-ink")
                }
              >
                <span className={"text-[10px] font-semibold " + (on ? "text-white/90" : "text-ink-faint")}>
                  {i === 0 ? "Today" : DOW[d.getDay()]}
                </span>
                <span className="text-[16px] font-bold leading-tight">{d.getDate()}</span>
                {on && <span className="absolute -bottom-[6px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-brand" />}
              </button>
            );
          })}

          <button
            onClick={() => setSheet(true)}
            className={
              "flex shrink-0 flex-col items-center justify-center rounded-[10px] border px-2.5 py-1.5 transition " +
              (pickActive ? "border-brand bg-brand text-white" : "border-[#ece2d6] bg-white text-ink")
            }
          >
            <span className={"text-[10px] font-semibold leading-tight " + (pickActive ? "text-white/90" : "text-ink-faint")}>
              {pickActive ? MON[customDate.getMonth()] : "Pick"}
            </span>
            <span className="text-[15px] font-bold leading-tight">{pickActive ? customDate.getDate() : "📅"}</span>
          </button>
        </div>
      </div>

      <CalendarSheet
        open={sheet}
        min={min}
        max={max}
        value={customDate}
        onSelect={(d) => onChange(toISO(d))}
        onClose={() => setSheet(false)}
      />
    </div>
  );
}
