import { useEffect, useState } from "react";
import type { Supply } from "../lib/supply";
import { offPctLabel, statusForDate } from "../lib/supply";
import { CalendarSheet } from "./CalendarSheet";
import { addDaysISO, fromISO, prettyISO, todayISO, toISO } from "../lib/dates";

// Delivery tag (ghost square) — Email / Pickup / Pickup & return.
const FORM: Record<string, { label: string; fg: string }> = {
  digital_email: { label: "Email", fg: "#36694f" },
  physical_coupon: { label: "Pickup", fg: "#8a6a22" },
  physical_circ: { label: "Pickup & return", fg: "#9c5a31" },
};

// A static, always-expanded pass card for the detail page: tag + price header,
// the discount breakdown, then the main Book button. No fold / chevron.
export function SupplyRow({ s, date, onBook }: { s: Supply; date: string; onBook: (s: Supply, date: string) => void }) {
  const [cal, setCal] = useState(false);
  const [pickDay, setPickDay] = useState(date);
  useEffect(() => setPickDay(date), [date]); // follow the page's target day

  const tag = FORM[s.form];
  const pickup = s.form !== "digital_email";
  const lines = policyLines(s);
  const rule = ruleText(s);
  const t = todayISO();
  const st = statusForDate(s.pass, pickDay);
  const ok = st === "available" || st === "limited";

  return (
    <div className="px-4 py-3">
      {/* header: tag + town · distance + price */}
      <div className="flex items-center gap-2">
        <span
          className="shrink-0 rounded-[4px] border border-[#ddd0bf] px-1.5 py-[1.5px] text-[10px] font-semibold"
          style={{ color: tag.fg }}
        >
          {tag.label}
        </span>
        {pickup && (
          <span className="truncate text-[12px] text-ink-soft">
            {s.town}
            {s.distance != null ? ` · ${s.distance} mi` : ""}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-baseline gap-1.5 font-price">
          {offPctLabel(s.deal) && (
            <span className="rounded-[3px] bg-[#e0455e] px-1 py-[1.5px] font-price text-[12px] font-medium leading-none text-white">
              {offPctLabel(s.deal)}
            </span>
          )}
          {s.deal.kind !== "discount" && s.deal.was != null && (
            <span className="text-[12px] text-ink-faint line-through">${s.deal.was}</span>
          )}
          <span className="text-[18px] font-extrabold tracking-tight text-brand-2">{finalLabel(s)}</span>
        </span>
      </div>

      {/* discount breakdown + capacity limit — divided from the price header */}
      <div className="mt-2.5 space-y-2 border-t border-[#f1e9dd] pt-2.5">
        <div className="flex items-start gap-3">
          <span className="w-16 shrink-0 text-[12px] text-ink-faint">Discount</span>
          <div className="flex-1 space-y-0.5 text-[14px] text-ink-soft">
            {lines.map((ln, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span>{ln.audience}</span>
                <span className="font-semibold text-ink">{ln.amount}</span>
              </div>
            ))}
          </div>
        </div>
        {rule && (
          <div className="flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-[12px] text-ink-faint">Limit</span>
            <span className="flex-1 text-[14px] text-[#c2691a]">{rule}</span>
          </div>
        )}
      </div>

      {/* main button (full → opens this pass's own date picker) */}
      <button
        onClick={() => (ok ? onBook(s, pickDay) : setCal(true))}
        className={"mt-3 w-full rounded-[10px] py-2.5 text-[14px] font-bold text-white " + (ok ? "bg-brand" : "bg-[#c2691a]")}
      >
        {ok ? `Book this pass, pick at ${prettyISO(pickDay)}` : "Pick another day"}
      </button>

      <CalendarSheet
        open={cal}
        min={fromISO(t)}
        max={fromISO(addDaysISO(t, 71))}
        value={fromISO(pickDay)}
        title="When can you get this pass?"
        statusFor={(iso) => statusForDate(s.pass, iso)}
        onSelect={(d) => setPickDay(toISO(d))}
        onClose={() => setCal(false)}
      />
    </div>
  );
}

function finalLabel(s: Supply): string {
  if (s.deal.kind === "free") return "FREE";
  if (s.deal.kind === "discount") return "Discount";
  return s.deal.now ?? s.deal.badge;
}

const capWord = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function amountFromForm(form?: string, value?: number | null): string | null {
  const f = (form || "").toLowerCase();
  if (f === "free") return "free";
  if (f.includes("percent")) return `${value}% off`;
  if (f.includes("off") || f.includes("amount")) return `$${value} off`;
  if (value != null) return `$${value}`;
  return null;
}

function policyLines(s: Supply): { audience: string; amount: string }[] {
  const ap = s.pass.coupon.audience_policies ?? [];
  const lines = ap
    .map((p) => ({ audience: capWord(p.audience || "Everyone"), amount: amountFromForm(p.form, p.value) }))
    .filter((x): x is { audience: string; amount: string } => !!x.amount);
  if (lines.length) return lines;
  const amt = s.deal.kind === "free" ? "free" : s.deal.kind === "discount" ? "discount" : s.deal.now ?? s.deal.badge;
  return [{ audience: "Everyone", amount: amt }];
}

function ruleText(s: Supply): string {
  const c = s.pass.coupon.capacity;
  if (!c?.n) return "";
  if (c.kind === "people" || !c.kind) return `Up to ${c.n} people`;
  return `${c.n} car${c.n > 1 ? "s" : ""}`;
}
