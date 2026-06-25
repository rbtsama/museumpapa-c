import { useMemo, useState } from "react";
import { PageHeader } from "./PageHeader";

interface Lib {
  id: string;
  town: string;
}

// Shared library-card page (used by sign-up and by Account). Selecting only
// flips the checkbox — same white row, no background change, no height jitter.
// The card-number field sits on the SAME line after the town. Confirm to keep,
// Cancel to discard.
export function CardPicker({
  libraries,
  initialCards,
  initialBarcodes,
  title,
  onConfirm,
  onCancel,
}: {
  libraries: Lib[];
  initialCards: string[];
  initialBarcodes: Record<string, string>;
  title: string;
  onConfirm: (cards: string[], barcodes: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set(initialCards));
  const [barcodes, setBarcodes] = useState<Record<string, string>>(() => ({ ...initialBarcodes }));

  const libs = useMemo(() => {
    const list = [...libraries].sort((a, b) => a.town.localeCompare(b.town));
    if (!q) return list;
    const s = q.toLowerCase();
    return list.filter((l) => l.town.toLowerCase().includes(s));
  }, [libraries, q]);

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const setBarcode = (id: string, v: string) => setBarcodes((b) => ({ ...b, [id]: v }));

  return (
    <div className="page-bg flex min-h-[100dvh] flex-col">
      <PageHeader title={title} onBack={onCancel} />
      <main className="flex-1 px-5 pb-28 pt-4">
        <div className="mx-auto w-full max-w-[400px]">
          <p className="text-[14px] text-ink-soft">Pick the cards you have. Add a card number for faster booking.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a town…" className="mt-3 w-full rounded-[10px] border border-edge bg-white px-3 py-2.5 text-[14px] outline-none focus:border-brand" />

        <div className="mt-3 space-y-1.5">
          {libs.map((l) => {
            const on = picked.has(l.id);
            return (
              <div
                key={l.id}
                className={"flex min-h-[48px] items-center gap-2 rounded-[12px] border bg-white pl-3 pr-2 " + (on ? "border-brand" : "border-edge")}
              >
                <button onClick={() => toggle(l.id)} className="flex shrink-0 items-center gap-2.5">
                  <span className={"flex h-5 w-5 items-center justify-center rounded-md border text-[12px] font-bold " + (on ? "border-brand bg-brand text-white" : "border-edge text-transparent")}>✓</span>
                  <span className="w-[84px] truncate text-left text-[14px] font-semibold text-ink">{l.town}</span>
                </button>
                {on && (
                  <input
                    value={barcodes[l.id] ?? ""}
                    onChange={(e) => setBarcode(l.id, e.target.value)}
                    placeholder="Card number (optional)"
                    inputMode="numeric"
                    autoComplete="off"
                    className="h-9 min-w-0 flex-1 rounded-[10px] border border-edge bg-white px-3 text-[14px] outline-none focus:border-brand"
                  />
                )}
              </div>
            );
          })}
          {!libs.length && <p className="py-4 text-center text-[12px] text-ink-faint">No matches.</p>}
          </div>
        </div>
      </main>

      {/* fixed Confirm / Cancel */}
      <div className="glass fixed inset-x-0 bottom-0 z-10 border-t border-[#eadccb]" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex w-full max-w-[400px] gap-3 px-5 pt-3">
          <button onClick={onCancel} className="flex-1 rounded-[10px] border border-edge bg-white py-3 text-[16px] font-semibold text-ink-soft">Cancel</button>
          <button onClick={() => onConfirm([...picked], barcodes)} className="flex-1 rounded-[10px] bg-brand py-3 text-[16px] font-bold text-white">
            Confirm{picked.size ? ` · ${picked.size}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
