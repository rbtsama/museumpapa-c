import { useEffect, useMemo, useState } from "react";
import type { DataBundle } from "../data/types";
import { loadData } from "../lib/data";
import { miles } from "../lib/distance";
import { bestStatusForDate, detailSupplies, type Supply } from "../lib/supply";
import { useWallet } from "../store/wallet";
import { DAYS, DAY_ABBR, formatHoursRange } from "../lib/hours";
import { addDaysISO, fromISO, prettyISO, todayISO, toISO } from "../lib/dates";
import { CalendarSheet } from "../components/CalendarSheet";
import { SupplyRow } from "../components/SupplyRow";
import { BookSheet } from "../components/BookSheet";
import { CardPicker } from "../components/CardPicker";
import { ShareInviteModal } from "../components/ShareInviteModal";
import { shareApp } from "../lib/share";

const AUD_ORDER = ["adult", "senior", "youth", "student", "child", "military", "educator", "family", "infant"];

export default function AttractionDetail({
  slug,
  date,
  onBack,
  onAddCard,
}: {
  slug: string;
  date: string; // default pickup day handed to each pass row
  onBack: () => void;
  onAddCard: () => void;
}) {
  const [data, setData] = useState<DataBundle | null>(null);
  const [wallet, setWallet] = useWallet();
  const [booking, setBooking] = useState<Supply | null>(null);
  const [editCards, setEditCards] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [heroErr, setHeroErr] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [detailDate, setDetailDate] = useState(date); // detail-local target day
  const [cal, setCal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [invite, setInvite] = useState(false); // post-Book "tell a friend" popup
  useEffect(() => {
    window.scrollTo(0, 0); // a detail page always opens at the top
    loadData().then(setData);
  }, []);

  useEffect(() => {
    // past a little scroll, swap the floating back button for a pinned bar
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const attr = data?.attrBySlug.get(slug) ?? null;
  const noCards = wallet.cards.length === 0;

  const supplies = useMemo(() => {
    if (!data || !attr || noCards) return [] as Supply[];
    return detailSupplies(attr, data, new Set(wallet.cards), wallet.location);
  }, [data, attr, noCards, wallet.cards, wallet.location]);

  const statusFor = useMemo(() => {
    const passes = supplies.map((s) => s.pass);
    return (iso: string) => bestStatusForDate(passes, iso);
  }, [supplies]);

  const liked = !!attr && wallet.liked.includes(attr.slug);

  function toggleLike() {
    if (!attr) return;
    const has = wallet.liked.includes(attr.slug);
    setWallet({ ...wallet, liked: has ? wallet.liked.filter((s) => s !== attr.slug) : [...wallet.liked, attr.slug] });
  }

  if (!data) return <div className="page-bg min-h-[100dvh]" />;
  if (!attr) {
    return (
      <div className="page-bg min-h-[100dvh] px-6 py-20 text-center">
        <p className="text-[14px] font-semibold text-ink-soft">Place not found</p>
        <button onClick={onBack} className="mt-3 text-[14px] font-bold text-brand">← Back</button>
      </div>
    );
  }

  const heroLocal = attr.hero_image_local ? attr.hero_image_local.replace("/static/images/", "/img/") : null;
  // detail hero uses the full-res remote image — the local cache is a tiny thumb
  // (a few KB) that blurs when enlarged. Fall back to it only if remote fails.
  const heroSrc = !heroErr && attr.hero_image ? attr.hero_image : heroLocal;
  const town = attr.address?.city ? `${attr.address.city}${attr.address.state ? ", " + attr.address.state : ""}` : "";
  const dist = miles(wallet.location, attr.geo);
  const resv = reservationLabel(attr.reservation?.required);
  const prices = orderedPrices(attr.prices);
  const desc = attr.description || "";
  const hasMore = !!(attr.hours || prices.length || attr.phone || attr.website || resv);

  return (
    <div className="page-bg flex min-h-[100dvh] flex-col">
      {/* pinned bar after scrolling past the hero: back · name · like */}
      {scrolled && (
        <div className="glass fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[440px] items-center gap-2 border-b border-[#eadccb] px-2 py-2">
          <button onClick={onBack} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h2 className="min-w-0 flex-1 truncate text-center font-display text-[15px] font-semibold text-ink">{attr.name}</h2>
          <button onClick={() => shareApp(attr.name)} aria-label="Share" className="grid h-9 w-9 shrink-0 place-items-center text-ink-soft active:scale-95">
            <ShareGlyph />
          </button>
          <button onClick={toggleLike} aria-label="Like" className="grid h-9 w-9 shrink-0 place-items-center text-ink-soft active:scale-95">
            <HeartGlyph liked={liked} />
          </button>
        </div>
      )}

      {/* hero — about a third of the viewport, full-res */}
      <div className="relative">
        <div className="relative h-[34vh] max-h-[320px] min-h-[190px] w-full overflow-hidden bg-bg2">
          {/* instant low-res placeholder: the local cache is a tiny thumb (KB),
              blurred up as an LQIP so this big area is never blank while the
              full-res remote image streams in */}
          {heroLocal && !heroLoaded && (
            <img src={heroLocal} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
          )}
          {!heroLocal && !heroLoaded && !heroErr && <div className="absolute inset-0 animate-pulse bg-[#e9ddcb]" />}
          {heroSrc && (
            <img
              src={heroSrc}
              onLoad={() => setHeroLoaded(true)}
              onError={() => setHeroErr(true)}
              alt=""
              className={"absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " + (heroLoaded ? "opacity-100" : "opacity-0")}
            />
          )}
          {!heroLoaded && !heroErr && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/80 border-t-transparent drop-shadow" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
        </div>
        <button onClick={onBack} aria-label="Back" className="glass absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink shadow-sm active:scale-95">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        {/* share sits to the LEFT of like, grouped top-right */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button onClick={() => shareApp(attr.name)} aria-label="Share" className="glass grid h-9 w-9 place-items-center rounded-full text-ink shadow-sm active:scale-95">
            <ShareGlyph />
          </button>
          <button onClick={toggleLike} aria-label="Like" className="glass grid h-9 w-9 place-items-center rounded-full text-ink shadow-sm active:scale-95">
            <HeartGlyph liked={liked} />
          </button>
        </div>
      </div>

      {/* ── Intro: name + short description; hours/tickets/full text fold away ── */}
      <div className="px-4 pt-3">
        <h1 className="font-display text-[20px] font-bold leading-tight text-ink">{attr.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-soft">
          {town && <span>{town}</span>}
          {town && dist != null && <span className="text-ink-faint">·</span>}
          {dist != null && <span>{dist} mi away</span>}
        </div>

        {attr.categories && attr.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {attr.categories.map((c) => (
              <span key={c} className="rounded-full bg-[#efe7da] px-2.5 py-[3px] text-[10px] font-semibold text-ink-soft">{c}</span>
            ))}
          </div>
        )}

        {desc && (
          <p
            onClick={() => hasMore && setDetailsOpen((o) => !o)}
            className={"mt-2.5 text-[14px] leading-relaxed text-ink-soft " + (detailsOpen ? "" : "line-clamp-3") + (hasMore ? " cursor-pointer" : "")}
          >
            {desc}
          </p>
        )}

        {hasMore && (
          <button onClick={() => setDetailsOpen((o) => !o)} className="mt-2 flex items-center gap-1 text-[12px] font-bold text-brand">
            {detailsOpen ? "Hide details" : "Hours, tickets & more"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={"transition-transform " + (detailsOpen ? "rotate-180" : "")}><path d="m6 9 6 6 6-6" /></svg>
          </button>
        )}

        {detailsOpen && (
          <div className="mt-3 space-y-4">
            {(resv || attr.phone || attr.website) && (
              <div className="space-y-1.5 text-[12px]">
                {resv && <p className="text-[#c2691a]">{resv}</p>}
                {attr.phone && <a href={`tel:${attr.phone}`} className="block text-ink-soft">📞 {attr.phone}</a>}
                {attr.website && (
                  <a href={attr.website} target="_blank" rel="noreferrer" className="block truncate font-semibold text-brand">{prettyHost(attr.website)} →</a>
                )}
              </div>
            )}

            {attr.hours && (
              <div>
                <h3 className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-soft">Hours</h3>
                <div className="rounded-[12px] border border-[#ece2d6] bg-white px-4 py-2">
                  {DAYS.map((d) => (
                    <div key={d} className="flex justify-between border-b border-[#f3ece1] py-1.5 text-[14px] last:border-0">
                      <span className="text-ink-soft">{DAY_ABBR[d]}</span>
                      <span className="font-medium text-ink">{formatHoursRange(attr.hours?.[d]) ?? "Closed"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular admission = the museum's OWN ticket price (NOT the pass price) */}
            {prices.length > 0 && (
              <div>
                <h3 className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-soft">Regular admission</h3>
                <p className="mb-1.5 text-[12px] text-ink-faint">What a ticket costs without a pass.</p>
                <div className="rounded-[12px] border border-[#ece2d6] bg-white px-4 py-2">
                  {prices.map((p) => (
                    <div key={p.audience} className="flex justify-between border-b border-[#f3ece1] py-1.5 text-[14px] last:border-0">
                      <span className="text-ink-soft">{cap(p.audience)}</span>
                      <span className="font-semibold text-ink">{p.price && p.price > 0 ? `$${p.price}` : "Free"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pass zone — the core: every channel carded, a light date selector ── */}
      <section className="mt-4 flex-1 rounded-t-[20px] border-t border-[#ece2d6] bg-[#f6f3ee] px-4 pb-28 pt-4 shadow-[0_-3px_14px_rgba(60,40,20,0.05)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-[18px] font-bold text-ink">Get your pass</h2>
          {!noCards && supplies.length > 0 && (
            <button onClick={() => setCal(true)} className="flex items-center gap-1.5 rounded-full border border-edge bg-white px-2.5 py-1 text-[12px] font-semibold text-ink-soft">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              {prettyISO(detailDate)}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          )}
        </div>

        {noCards ? (
          <button onClick={onAddCard} className="flex w-full items-center justify-between rounded-[12px] border border-[#ece2d6] bg-white px-4 py-3">
            <span className="text-[12px] font-medium text-ink-soft">🔒 Add a library card to see your deal</span>
            <span className="text-[14px] font-bold text-brand">Add →</span>
          </button>
        ) : supplies.length === 0 ? (
          <div className="rounded-[12px] border border-[#ece2d6] bg-white px-4 py-5 text-center text-[12px] text-ink-faint">
            None of your cards offer a pass here.
          </div>
        ) : (
          <div className="space-y-2.5">
            {supplies.map((s, i) => (
              <div key={s.libId + i} className="overflow-hidden rounded-[12px] border border-[#ece2d6] bg-[#fdfaf4] shadow-card">
                <SupplyRow s={s} date={detailDate} onBook={setBooking} />
              </div>
            ))}
          </div>
        )}
      </section>

      <CalendarSheet
        open={cal}
        min={fromISO(todayISO())}
        max={fromISO(addDaysISO(todayISO(), 71))}
        value={fromISO(detailDate)}
        statusFor={statusFor}
        onSelect={(d) => setDetailDate(toISO(d))}
        onClose={() => setCal(false)}
      />

      {data && (
        <BookSheet
          supply={booking}
          data={data}
          barcodes={wallet.barcodes}
          onClose={() => setBooking(null)}
          onAddCard={() => setEditCards(true)}
          onBooked={() => setInvite(true)}
        />
      )}

      <ShareInviteModal open={invite} attractionName={attr.name} onClose={() => setInvite(false)} />

      {editCards && (
        <div className="fixed inset-0 z-[80] overflow-y-auto">
          <CardPicker
            libraries={data.libraries}
            initialCards={wallet.cards}
            initialBarcodes={wallet.barcodes}
            title="Your library cards"
            onConfirm={(c, b) => { setWallet({ ...wallet, cards: c, barcodes: b }); setEditCards(false); }}
            onCancel={() => setEditCards(false)}
          />
        </div>
      )}
    </div>
  );
}

function reservationLabel(required?: string): string | null {
  if (required === "timed_entry") return "Timed entry · reserve a slot on the museum site";
  if (required === "recommended") return "Reservation recommended";
  return null;
}

function orderedPrices(prices?: { audience: string; price: number | null }[]): { audience: string; price: number | null }[] {
  const seen = new Map<string, number | null>();
  for (const p of prices ?? []) if (!seen.has(p.audience)) seen.set(p.audience, p.price);
  return [...seen.entries()]
    .map(([audience, price]) => ({ audience, price }))
    .sort((a, b) => idx(a.audience) - idx(b.audience));
}
const idx = (a: string) => {
  const i = AUD_ORDER.indexOf(a);
  return i < 0 ? 99 : i;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function prettyHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

function HeartGlyph({ liked }: { liked: boolean }) {
  // bold stroked heart (the old Unicode ♡ rendered hairline-thin); fills pink
  // when liked, otherwise a thick outline in the button's currentColor
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={liked ? "#e0556b" : "none"}
      stroke={liked ? "#e0556b" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
