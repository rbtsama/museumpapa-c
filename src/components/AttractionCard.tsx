import { audiencePrice, cheapestSupply, offPctLabel, type AttractionRow, type Supply } from "../lib/supply";
import { summarizeHours } from "../lib/hours";
import { ClockIcon, PinIcon, TicketIcon } from "./icons";

export function AttractionCard({
  row,
  onOpen,
  liked = false,
  onToggleLike,
  unavailable = false,
}: {
  row: AttractionRow;
  onOpen?: () => void;
  liked?: boolean;
  onToggleLike?: () => void;
  unavailable?: boolean;
}) {
  const a = row.attr;
  const img = a.hero_image_local ? a.hero_image_local.replace("/static/images/", "/img/") : null;
  const adultRaw = (a.prices || []).find((p) => p.audience === "adult")?.price;
  const adult = adultRaw != null && adultRaw > 0 ? adultRaw : null; // strike-through anchor
  const freeAttr = adultRaw === 0; // the attraction itself is free admission
  const child = audiencePrice(a, "child");
  const hours = summarizeHours(a.hours);
  const resv = reservationLabel(a.reservation?.required);
  const cs = cheapestSupply(row);

  return (
    // connected white list — rows divided by a hairline, no card gaps/corners
    <div onClick={onOpen} className={"flex cursor-pointer gap-3 border-b border-[#eee4d6] px-4 py-3 active:bg-[#faf6f0] " + (unavailable ? "bg-[#ece5db]" : "")}>
      {/* left photo — flush, spans the row height; heart pinned top-right */}
      <div className="relative w-[124px] shrink-0 self-stretch overflow-hidden rounded-[10px] bg-bg2">
        {img && <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
        {unavailable && (
          <span className="absolute left-0 top-0 rounded-br-[8px] bg-[#8a8078] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            Full
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike?.(); }}
          aria-label="Like"
          className="absolute right-1.5 top-1.5 active:scale-90"
        >
          <HeartIcon liked={liked} />
        </button>
      </div>

      {/* right: attraction info, then a set-off Offer block */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="break-words font-display text-[15px] font-semibold leading-snug text-ink">{a.name}</h3>

        {/* attraction info — regular ticket prices, distance, hours/reservation */}
        <div className="mt-1 space-y-0.5">
          {freeAttr ? (
            <InfoLine icon={<TicketIcon className="text-ink-faint" />}>
              <b className="font-semibold text-ink">Free entry</b>
            </InfoLine>
          ) : (adult != null || child != null) ? (
            <InfoLine icon={<TicketIcon className="text-ink-faint" />}>
              {adult != null && <>Adult <b className="font-semibold text-ink">${adult}</b></>}
              {adult != null && child != null && " · "}
              {child != null && <>Child <b className="font-semibold text-ink">${child}</b></>}
            </InfoLine>
          ) : null}
          {a.geo && row.distance != null && (
            <InfoLine icon={<PinIcon className="text-ink-faint" />}>{row.distance} mi away</InfoLine>
          )}
          {hours && (
            <InfoLine icon={<ClockIcon className="text-ink-faint" />}>{hours}</InfoLine>
          )}
          {resv && <div className="text-[12px] text-[#c2691a]/85">{resv}</div>}
        </div>

        {/* Offer — delivery tag sits right above the price (right-aligned); which
            library / how far lives on the detail page */}
        {cs ? (
          <div className="mt-auto flex flex-col items-end gap-0.5 pt-2">
            <DeliveryTag s={cs.supply} />
            <Price s={cs.supply} multi={cs.multi} adult={adult} />
          </div>
        ) : (
          <div className="mt-auto pt-2 text-right text-[12px] font-medium text-ink-faint">🔒 Add a card</div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ icon, children, tone }: { icon: React.ReactNode; children: React.ReactNode; tone?: "warm" }) {
  return (
    <div className={"flex items-center gap-1.5 text-[12px] " + (tone === "warm" ? "text-[#c2691a]/85" : "text-ink-soft")}>
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function DeliveryTag({ s }: { s: Supply }) {
  // ghost tag — identical to the detail page's SupplyRow tag
  const t =
    s.form === "digital_email"
      ? { text: "Email", fg: "#36694f" }
      : s.form === "physical_circ"
        ? { text: "Pickup & return", fg: "#9c5a31" }
        : { text: "Pickup", fg: "#8a6a22" };
  return (
    <span className="shrink-0 rounded-[4px] border border-[#ddd0bf] px-1.5 py-[1.5px] text-[10px] font-semibold" style={{ color: t.fg }}>
      {t.text}
    </span>
  );
}

function Price({ s, multi, adult }: { s: Supply; multi: boolean; adult: number | null }) {
  if (s.deal.kind === "free") {
    // strike the attraction's real price (if any) next to "Free"; a free
    // attraction (adult === null here) shows just Free, no strike.
    return (
      <span className="flex items-baseline gap-1 font-price">
        {adult != null && <span className="text-[12px] text-ink-faint line-through">${adult}</span>}
        <span className="text-[22px] font-semibold leading-none text-brand-2">Free</span>
      </span>
    );
  }
  const now = s.deal.now ?? s.deal.badge;
  const off = offPctLabel(s.deal);
  return (
    <span className="flex items-baseline gap-1 font-price">
      {off && <OffTag>{off}</OffTag>}
      {adult != null && s.deal.was != null && (
        <span className="text-[12px] text-ink-faint line-through">${adult}</span>
      )}
      {multi && <span className="text-[11px] font-medium text-ink-soft">from</span>}
      <span className="text-[22px] font-semibold leading-none tracking-tight text-brand-2">{now}</span>
    </span>
  );
}

function OffTag({ children }: { children: React.ReactNode }) {
  // pink solid + thin white price-font label, sized like the strike price
  return (
    <span className="rounded-[3px] bg-[#e0455e] px-1 py-[1.5px] font-price text-[12px] font-medium leading-none text-white">
      {children}
    </span>
  );
}

function HeartIcon({ liked }: { liked: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={liked ? "#e0556b" : "rgba(0,0,0,0.42)"}
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function reservationLabel(required?: string): string | null {
  if (required === "timed_entry") return "Reserve a time after pickup";
  if (required === "recommended") return "Reservation recommended";
  return null;
}
