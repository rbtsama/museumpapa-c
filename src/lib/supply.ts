import type { Attraction, AvailRaw, DataBundle, Pass, PassForm } from "../data/types";
import { miles } from "./distance";

// ---------------------------------------------------------------------------
// Date-scoped availability. The supply SET for an attraction is date-agnostic
// (dedup/frontier depend only on deal + distance); only each pass's per-date
// inventory varies. So we keep buildRows date-free and read status per date here.
//   bookable = available | limited  ·  blocked = booked | closed | unavailable
//   none = no snapshot entry for that date (out of the ~3-month window)
// ---------------------------------------------------------------------------
export type AvailStatus = AvailRaw | "none";

export function statusForDate(pass: Pass, dateISO: string): AvailStatus {
  return pass.availability?.[dateISO] ?? "none";
}

export function isBookable(s: AvailStatus): boolean {
  return s === "available" || s === "limited";
}

const STATUS_RANK: Record<AvailStatus, number> = {
  available: 0,
  limited: 1,
  booked: 2,
  unavailable: 3,
  closed: 4,
  none: 5,
};

// Best (most bookable) status across a set of passes for a given date.
export function bestStatusForDate(passes: Pass[], dateISO: string): AvailStatus {
  let best: AvailStatus = "none";
  for (const p of passes) {
    const st = statusForDate(p, dateISO);
    if (STATUS_RANK[st] < STATUS_RANK[best]) best = st;
    if (best === "available") break;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Deal parsing — turn coupon.summary into a comparable savings + a display
// string. Per product rule: show "$ off" or a fixed "$N" (NEVER a %), with the
// adult single-ticket price struck through as the marketing anchor.
// ---------------------------------------------------------------------------
// The deal is ALWAYS one of exactly 5 forms (data produces nothing else):
//   free · "N% off" · "$N off" · "$N" (fixed) · discount (amount unknown).
export type DealKind = "free" | "percent" | "amount_off" | "fixed" | "discount";

export interface Deal {
  kind: DealKind;
  badge: string; // the form label: "Free" | "50% off" | "$5 off" | "$9" | "Discount"
  savings: number | null; // per adult, for ranking
  // small price component shown to the LEFT of the badge (null for discount).
  was: number | null; // struck original (adult)
  now: string | null; // discounted price
}

export function parseDeal(summary: string, adult: number | null): Deal {
  const s = (summary || "").toLowerCase().trim();
  // show the struck original ONLY when it's genuinely higher than the final
  // price — otherwise (missing/zero/lower) a strikethrough would be nonsense.
  const mk = (kind: DealKind, badge: string, savings: number | null, finalNum: number | null, now: string | null): Deal => ({
    kind,
    badge,
    savings,
    was: kind !== "discount" && adult != null && finalNum != null && adult > finalNum ? adult : null,
    now: kind === "discount" ? null : now,
  });
  if (s === "free") return mk("free", "Free", adult, 0, "$0");
  if (s.includes("half") || /\d+%\s*off/.test(s)) {
    const pct = s.includes("half") ? 50 : parseInt(s.match(/(\d+)%/)?.[1] ?? "50", 10);
    const fin = adult != null ? round(adult * (1 - pct / 100)) : null;
    return mk("percent", `${pct}% off`, adult != null ? round((adult * pct) / 100) : null, fin, fin != null ? money(fin) : null);
  }
  const off = s.match(/\$([0-9.]+)\s*off/);
  if (off) {
    const n = parseFloat(off[1]);
    const fin = adult != null ? round(adult - n) : null;
    return mk("amount_off", `$${n} off`, n, fin, fin != null ? money(fin) : null);
  }
  const fixed = s.match(/\$([0-9.]+)/);
  if (fixed) {
    const n = parseFloat(fixed[1]);
    return mk("fixed", money(n), adult != null ? round(adult - n) : null, n, money(n));
  }
  return mk("discount", "Discount", null, null, null);
}

// "50% off"-style label from a deal's savings vs the original price. Null for
// free (shown as "Free"), unknown-discount, or no original price.
export function offPctLabel(deal: Deal): string | null {
  // "50% off" tag shows ONLY when both hold:
  //  (a) the POLICY itself is a percent-off (deal.kind === "percent") — never
  //      computed from savings ÷ price (those 52%/78% figures were wrong), and
  //  (b) we can show a concrete final amount (deal.now != null).
  // (b) prevents the tag AND the price from both reading "50% off": when there's
  // no original price the final falls back to the "50% off" badge, so in that
  // case we drop the tag and let the price carry it.
  return deal.kind === "percent" && deal.now != null ? deal.badge : null;
}

// ---------------------------------------------------------------------------
// Supply = one bookable channel (a library's pass) for an attraction.
// ---------------------------------------------------------------------------
export interface Supply {
  form: PassForm;
  libId: string;
  libName: string;
  town: string;
  distance: number | null; // null/0 for email (no trip)
  deal: Deal;
  capacity: number | null;
  pass: Pass;
  // all the user's cards that yield this same deal+form (for the Book popup).
  eligibleLibIds: string[];
  hiddenCount: number; // weaker offers folded under this one
}

export interface AttractionRow {
  attr: Attraction;
  adult: number | null;
  distance: number | null; // attraction → user
  supplies: Supply[];
}

const FORM_RANK: Record<PassForm, number> = {
  digital_email: 0,
  physical_coupon: 1,
  physical_circ: 2,
};

// Single-ticket price for an audience, treating missing/zero as "no price"
// (some attractions store 0). Used as the strike-through anchor and on cards.
export function audiencePrice(a: Attraction, audience: string): number | null {
  const p = (a.prices || []).find((x) => x.audience === audience && x.price != null && (x.price as number) > 0);
  return p ? (p.price as number) : null;
}

function adultPrice(a: Attraction): number | null {
  return audiencePrice(a, "adult");
}

// Build the personalized supply set for one attraction, applying:
//  (1) only the user's held cards,
//  (2) dedup identical (form+summary), keep the nearest,
//  (3) one best email (pure price — no trip, so cheapest/strongest wins),
//  (4) Pareto frontier over (savings, distance) so pickups compete on deal AND
//      travel cost rather than deal alone,
//  (5) sort Email → Pickup → Loan by savings then distance; at most 4 rows.
export function suppliesFor(
  attr: Attraction,
  data: DataBundle,
  heldCards: Set<string>,
  user?: { lat: number; lon: number },
): Supply[] {
  const adult = adultPrice(attr);
  const cands = data.passes
    .filter((p) => p.attraction_slug === attr.slug && heldCards.has(p.library_id))
    .map((p) => {
      const lib = data.libById.get(p.library_id)!;
      const isEmail = p.pass_form === "digital_email";
      return {
        pass: p,
        form: p.pass_form,
        libId: p.library_id,
        libName: lib?.name ?? p.library_id,
        town: lib?.town ?? "",
        distance: isEmail ? 0 : miles(user, lib?.geo),
        deal: parseDeal(p.coupon.summary, adult),
        capacity: p.coupon.capacity?.n ?? null,
      };
    });
  if (!cands.length) return [];

  // dedup identical (form + summary) keeping the nearest
  const byKey = new Map<string, (typeof cands)[number] & { dupIds: string[] }>();
  for (const c of cands) {
    const key = `${c.form}|${c.pass.coupon.summary}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...c, dupIds: [c.libId] });
    } else {
      prev.dupIds.push(c.libId);
      if ((c.distance ?? 9999) < (prev.distance ?? 9999)) {
        const dup = prev.dupIds;
        byKey.set(key, { ...c, dupIds: dup });
      }
    }
  }
  const distinct = [...byKey.values()];

  const sav = (x: { deal: Deal }) => x.deal.savings ?? -1;
  const emails = distinct.filter((d) => d.form === "digital_email");
  // ONE best email only — highest savings; tie → free first, then nearest.
  const emailBest =
    emails.sort(
      (a, b) =>
        sav(b) - sav(a) ||
        Number(b.deal.kind === "free") - Number(a.deal.kind === "free") ||
        (a.distance ?? 0) - (b.distance ?? 0),
    )[0] ?? null;
  // Pickup/Loan carry a real travel cost, so we DON'T collapse them to one — a
  // closer-but-smaller discount can be the better choice than a farther-but-bigger
  // one, and that's the user's call. Keep the Pareto frontier over (savings high,
  // distance low). The best email joins the same comparison: its 0 distance lets a
  // Free email dominate weaker pickups (→ a single row), but an Email 50%-off can't
  // hide a Pickup Free that's further away (→ both shown). Email is capped at one.
  const nonEmail = distinct.filter((d) => d.form !== "digital_email");
  const pool = [...(emailBest ? [emailBest] : []), ...nonEmail];
  const dist = (x: { distance: number | null }) => x.distance ?? 9999;
  const frontier = pool.filter(
    (d) =>
      !pool.some(
        (o) =>
          o !== d &&
          sav(o) >= sav(d) &&
          dist(o) <= dist(d) &&
          // a tie on both deal AND distance → the more convenient form wins, so a
          // local pickup at the same % off as the email is redundant and dropped.
          (sav(o) > sav(d) || dist(o) < dist(d) || FORM_RANK[o.form] < FORM_RANK[d.form]),
      ),
  );

  // order Email → Pickup → Loan, then strongest deal, then nearest; cap at 4.
  frontier.sort(
    (a, b) => FORM_RANK[a.form] - FORM_RANK[b.form] || sav(b) - sav(a) || dist(a) - dist(b),
  );
  const kept = frontier.slice(0, 4);

  const shownLibIds = new Set(kept.flatMap((d) => d.dupIds));
  const hiddenTotal = cands.length - shownLibIds.size;

  return kept.map((d, i) => ({
    form: d.form,
    libId: d.libId,
    libName: d.libName,
    town: d.town,
    distance: d.distance,
    deal: d.deal,
    capacity: d.capacity,
    pass: d.pass,
    eligibleLibIds: d.dupIds,
    hiddenCount: i === kept.length - 1 ? hiddenTotal : 0,
  }));
}

// ── List summary: the single cheapest supply (most savings → lowest final price
// for one attraction; email wins ties) plus whether there are others, which the
// card renders as a "from" prefix. The list card shows just this one line. ─────
export function cheapestSupply(row: AttractionRow): { supply: Supply; multi: boolean } | null {
  if (!row.supplies.length) return null;
  const best = [...row.supplies].sort(
    (a, b) =>
      (b.deal.savings ?? -1) - (a.deal.savings ?? -1) ||
      Number(b.form === "digital_email") - Number(a.form === "digital_email"),
  )[0];
  return { supply: best, multi: row.supplies.length > 1 };
}

// ── Detail page: show ALL channels. Email is deduped to its single cheapest row;
// pickup / pickup&return are NOT deduped (different libraries/deals all kept) —
// up to 3 each, 7 total, ordered Email → Pickup → Pickup&return. ──────────────
export function detailSupplies(
  attr: Attraction,
  data: DataBundle,
  heldCards: Set<string>,
  user?: { lat: number; lon: number },
): Supply[] {
  const adult = adultPrice(attr);
  const cands: Supply[] = data.passes
    .filter((p) => p.attraction_slug === attr.slug && heldCards.has(p.library_id))
    .map((p) => {
      const lib = data.libById.get(p.library_id);
      const isEmail = p.pass_form === "digital_email";
      return {
        form: p.pass_form,
        libId: p.library_id,
        libName: lib?.name ?? p.library_id,
        town: lib?.town ?? "",
        distance: isEmail ? 0 : miles(user, lib?.geo),
        deal: parseDeal(p.coupon.summary, adult),
        capacity: p.coupon.capacity?.n ?? null,
        pass: p,
        eligibleLibIds: [p.library_id],
        hiddenCount: 0,
      };
    });
  if (!cands.length) return [];

  const sav = (x: Supply) => x.deal.savings ?? -1;
  const dist = (x: Supply) => x.distance ?? 9999;
  const byStrength = (a: Supply, b: Supply) => sav(b) - sav(a) || dist(a) - dist(b);

  const emails = cands.filter((c) => c.form === "digital_email").sort(byStrength);
  const email1 = emails.length ? [emails[0]] : [];
  const pickups = cands.filter((c) => c.form === "physical_coupon").sort(byStrength).slice(0, 3);
  const loans = cands.filter((c) => c.form === "physical_circ").sort(byStrength).slice(0, 3);

  return [...email1, ...pickups, ...loans].slice(0, 7);
}

// Build the full personalized, distance-sorted attraction list.
export function buildRows(
  data: DataBundle,
  heldCards: Set<string>,
  user?: { lat: number; lon: number },
): AttractionRow[] {
  const rows: AttractionRow[] = [];
  for (const attr of data.attractions) {
    const supplies = suppliesFor(attr, data, heldCards, user);
    if (!supplies.length) continue;
    rows.push({
      attr,
      adult: adultPrice(attr),
      distance: miles(user, attr.geo),
      supplies,
    });
  }
  rows.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  return rows;
}

// No-cards mode: every attraction as a header-only row (no supplies), distance
// sorted. The list shows places; deals stay locked until a card is added.
export function allRows(data: DataBundle, user?: { lat: number; lon: number }): AttractionRow[] {
  return data.attractions
    .map((attr) => ({ attr, adult: adultPrice(attr), distance: miles(user, attr.geo), supplies: [] as Supply[] }))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
function money(n: number) {
  const r = round(n);
  return Number.isInteger(r) ? `$${r}` : `$${r.toFixed(2)}`;
}
