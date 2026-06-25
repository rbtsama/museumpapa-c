import { useEffect, useMemo, useState } from "react";
import type { DataBundle } from "../data/types";
import { loadData } from "../lib/data";
import { allRows, bestStatusForDate, buildRows, isBookable, type AttractionRow } from "../lib/supply";
import { useWallet } from "../store/wallet";
import { DateStrip } from "../components/DateStrip";
import { AttractionCard } from "../components/AttractionCard";
import { AuthGate, type AuthResult } from "../components/AuthGate";

type Sort = "distance" | "az";
const SORTS: { k: Sort; label: string }[] = [
  { k: "distance", label: "Nearest" },
  { k: "az", label: "A–Z" },
];

export default function Home({
  date,
  onDateChange,
  onOpenDetail,
  onProfile,
  onAddCard,
}: {
  date: string;
  onDateChange: (iso: string) => void;
  onOpenDetail: (slug: string) => void;
  onProfile: () => void;
  onAddCard: () => void;
}) {
  const [data, setData] = useState<DataBundle | null>(null);
  const [wallet, setWallet] = useWallet();
  const [sort, setSort] = useState<Sort>("distance");
  const [sortTouched, setSortTouched] = useState(false); // show the chosen sort once picked
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [barcodeDismissed, setBarcodeDismissed] = useState(false);
  const [flexible, setFlexible] = useState(false); // "Any day" — no date filter, list everything
  const signedIn = !!wallet.email; // logged in iff we have an email on file

  function finishAuth(r: AuthResult) {
    setWallet({
      ...wallet,
      email: r.email,
      name: r.name || wallet.name,
      zip: r.zip || wallet.zip,
      cards: r.cards ?? wallet.cards,
      barcodes: r.barcodes ?? wallet.barcodes,
      liked: r.liked ?? wallet.liked,
    });
  }

  const noCards = wallet.cards.length === 0;
  // thin reminder: has cards, but none has a card number yet
  const showBarcodeBar =
    !noCards && !barcodeDismissed && !wallet.cards.some((id) => (wallet.barcodes[id] || "").trim());

  useEffect(() => {
    loadData().then(setData);
  }, []);

  const baseRows = useMemo(() => {
    if (!data) return [] as AttractionRow[];
    return noCards ? allRows(data, wallet.location) : buildRows(data, new Set(wallet.cards), wallet.location);
  }, [data, noCards, wallet.cards, wallet.location]);

  const rows = useMemo(() => {
    let r = baseRows;
    if (!noCards) {
      if (filters.has("free")) r = r.filter((x) => x.supplies.some((s) => s.deal.kind === "free"));
      if (filters.has("email")) r = r.filter((x) => x.supplies.some((s) => s.form === "digital_email"));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      r = r.filter((x) => x.attr.name.toLowerCase().includes(q));
    }
    const out = [...r];
    if (sort === "az") out.sort((a, b) => a.attr.name.localeCompare(b.attr.name));
    else out.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    // liked items pinned to top in like-order, ignoring the sort — but only if
    // they survived the active filters (Free / Email Pass can still drop them).
    const likedIdx = new Map(wallet.liked.map((s, i) => [s, i] as const));
    const pinned = out
      .filter((x) => likedIdx.has(x.attr.slug))
      .sort((a, b) => likedIdx.get(a.attr.slug)! - likedIdx.get(b.attr.slug)!);
    const rest = out.filter((x) => !likedIdx.has(x.attr.slug));
    return [...pinned, ...rest];
  }, [baseRows, sort, filters, noCards, query, wallet.liked]);

  // With a concrete date picked, split the list: places bookable that day stay
  // on top; full ones sink below a divider (and get a corner badge). Any-day mode
  // skips the split — it lists everything and you open each pass to see its dates.
  const { liveRows, soldOutRows } = useMemo(() => {
    if (flexible || noCards) return { liveRows: rows, soldOutRows: [] as AttractionRow[] };
    const live: AttractionRow[] = [];
    const out: AttractionRow[] = [];
    for (const r of rows) {
      const passes = r.supplies.map((s) => s.pass);
      (isBookable(bestStatusForDate(passes, date)) ? live : out).push(r);
    }
    return { liveRows: live, soldOutRows: out };
  }, [rows, date, noCards, flexible]);

  function toggleLike(slug: string) {
    const has = wallet.liked.includes(slug);
    setWallet({ ...wallet, liked: has ? wallet.liked.filter((s) => s !== slug) : [...wallet.liked, slug] });
  }

  const toggle = (k: string) =>
    setFilters((f) => {
      const n = new Set(f);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  // picking a concrete day leaves Any-day mode
  const pickDate = (iso: string) => { onDateChange(iso); setFlexible(false); };

  const emptyState = (
    <div className="px-6 py-16 text-center">
      <p className="text-[14px] font-semibold text-ink-soft">No places match</p>
      <p className="mt-1 text-[12px] text-ink-faint">{query ? "Try a different search." : "Try turning off a filter."}</p>
    </div>
  );

  // Not signed in → force the login modal over an empty branded background;
  // no list, no data behind it.
  if (!signedIn) {
    return (
      <div className="min-h-full">
        <AuthGate onAuth={finishAuth} libraries={data?.libraries ?? []} />
      </div>
    );
  }

  return (
    <div className="page-bg flex min-h-[100dvh] flex-col">
      <header className="glass sticky top-0 z-20 border-b border-[#eadccb]">
        <div className="flex items-center gap-2.5 px-4 pb-1.5 pt-2.5">
          <div className="shrink-0 font-display text-[16px] font-semibold tracking-tight">
            Museum<span className="text-brand">Papa</span>
          </div>
          {/* slim outlined search field, no fill — blends into the bar */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-edge px-3 py-1.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7e9488" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a museum"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0 text-[13px] text-ink-faint" aria-label="Clear">✕</button>
            )}
          </div>
          {/* account: a small person icon, same size as the search glyph */}
          <button
            onClick={onProfile}
            aria-label="Account"
            className="grid h-9 w-9 shrink-0 place-items-center text-ink-soft active:scale-95"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M5.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" />
            </svg>
          </button>
        </div>

        <DateStrip
          value={date}
          onChange={pickDate}
          flexible={flexible}
          onFlexibleToggle={noCards ? undefined : () => setFlexible((f) => !f)}
        />

        {/* third row — compact & light, like Trip.com: a dropdown (icon + value +
            arrow, no box) and plain-text quick filters */}
        {/* sort + quick filters as soft-filled pills (clearly tappable; pill shape
            ≠ the square day cells / square delivery tags, so they don't blur) */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2 pt-0.5 text-[12px]">
          <div className="relative">
            <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1 rounded-[3px] bg-[#f1ece3] px-2.5 py-1 text-ink-soft">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" />
              </svg>
              <span className="font-medium text-ink">{sortTouched ? SORTS.find((s) => s.k === sort)!.label : "Sort"}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className={"text-ink-faint transition-transform " + (sortOpen ? "rotate-180" : "")}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                <div className="absolute left-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-[10px] border border-edge bg-white py-1 shadow-card">
                  {SORTS.map((o) => (
                    <button
                      key={o.k}
                      onClick={() => { setSort(o.k); setSortTouched(true); setSortOpen(false); }}
                      className={"block w-full px-3 py-1.5 text-left text-[12px] " + (sort === o.k ? "font-bold text-brand" : "text-ink-soft")}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {!noCards && (
            <>
              <FilterChip on={filters.has("free")} onClick={() => toggle("free")}>Free Pass</FilterChip>
              <FilterChip on={filters.has("email")} onClick={() => toggle("email")}>Email Delivery</FilterChip>
            </>
          )}
        </div>
      </header>

      <main className="list-bg flex-1 pb-10">
        {!data ? (
          <CardSkeletons />
        ) : (
          <>
            {showBarcodeBar && (
              <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-[10px] bg-brand/[.07] px-3 py-1.5 text-[12px]">
                <span className="flex-1 text-ink-soft">Add your card numbers to book faster.</span>
                <button onClick={onAddCard} className="font-bold text-brand">Add</button>
                <button onClick={() => setBarcodeDismissed(true)} className="px-1 text-ink-faint" aria-label="Dismiss">✕</button>
              </div>
            )}
            {liveRows.length === 0 && soldOutRows.length === 0 ? (
              emptyState
            ) : (
              <>
                {liveRows.map((row) => (
                  <AttractionCard
                    key={row.attr.slug}
                    row={row}
                    onOpen={() => onOpenDetail(row.attr.slug)}
                    liked={wallet.liked.includes(row.attr.slug)}
                    onToggleLike={() => toggleLike(row.attr.slug)}
                  />
                ))}

                {soldOutRows.length > 0 && (
                  <>
                    <div className="border-y border-[#e1d7c9] bg-[#ece5db] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-ink-soft">
                      Sold out for this day
                    </div>
                    {soldOutRows.map((row) => (
                      <AttractionCard
                        key={row.attr.slug}
                        row={row}
                        unavailable
                        onOpen={() => onOpenDetail(row.attr.slug)}
                        liked={wallet.liked.includes(row.attr.slug)}
                        onToggleLike={() => toggleLike(row.attr.slug)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CardSkeletons() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 border-b border-[#eee4d6] px-4 py-3">
          <div className="h-[96px] w-[124px] shrink-0 animate-pulse rounded-[10px] bg-bg2" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/3 animate-pulse rounded bg-bg2" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-bg2" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-bg2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterChip({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-[3px] px-2.5 py-1 text-[12px] font-medium transition " +
        (on ? "bg-brand text-white" : "bg-[#f1ece3] text-ink-soft")
      }
    >
      {children}
    </button>
  );
}
