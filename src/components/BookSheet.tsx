import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DataBundle } from "../data/types";
import type { Supply } from "../lib/supply";

// Booking: pick which of your cards to use. Then the action depends on whether
// that card has a saved number — copy it and book, or just open the library
// site to book.
export function BookSheet({
  supply,
  data,
  barcodes,
  onClose,
  onAddCard,
  onBooked,
}: {
  supply: Supply | null;
  data: DataBundle;
  barcodes: Record<string, string>;
  onClose: () => void;
  onAddCard: () => void;
  onBooked: () => void; // fired the instant we open the library site (→ share popup)
}) {
  const open = !!supply;
  const cards = supply?.eligibleLibIds ?? [];
  const [sel, setSel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // default-select when there's only one eligible card; reset on reopen
  useEffect(() => {
    setSel(cards.length === 1 ? cards[0] : null);
    setCopied(false);
  }, [supply]); // eslint-disable-line react-hooks/exhaustive-deps

  const barcode = sel ? (barcodes[sel] || "").trim() : "";

  function book() {
    if (!sel || !supply) return;
    if (barcode) {
      navigator.clipboard?.writeText(barcode).catch(() => {});
      setCopied(true);
      window.setTimeout(() => { window.open(supply.pass.source_url, "_blank"); onBooked(); onClose(); }, 450);
    } else {
      window.open(supply.pass.source_url, "_blank");
      onBooked();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && supply && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[rgba(10,30,22,.4)]" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[440px] rounded-t-[20px] bg-white px-5 pt-2"
            style={{ paddingBottom: "max(18px, env(safe-area-inset-bottom))" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto my-2.5 h-1 w-10 rounded-full bg-edge" />
            <h4 className="font-display text-[18px] font-semibold">Select a card to book</h4>
            <p className="mb-3 mt-0.5 text-[12px] text-ink-faint">Pick one of your cards for this pass.</p>

            <div className="space-y-2">
              {cards.map((id) => {
                const lib = data.libById.get(id);
                const bc = (barcodes[id] || "").trim();
                const on = sel === id;
                return (
                  <div
                    key={id}
                    className={"flex items-center gap-2 rounded-[12px] border px-3 py-3 transition " + (on ? "border-brand bg-brand/[.06]" : "border-edge bg-white")}
                  >
                    <button onClick={() => setSel(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className={"grid h-5 w-5 shrink-0 place-items-center rounded-full border " + (on ? "border-brand" : "border-edge")}>
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-ink">{lib?.town ?? id} card</span>
                        <span className="block text-[12px] text-ink-faint">
                          {bc ? `Card •••• ${bc.slice(-4)}` : "Add your card number to book faster"}
                        </span>
                      </span>
                    </button>
                    {!bc && (
                      <button onClick={onAddCard} className="shrink-0 px-1.5 text-[14px] font-bold text-[#c2691a]">
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={book}
              disabled={!sel}
              className="mt-4 w-full rounded-[10px] bg-brand py-3 text-[14px] font-bold text-white transition disabled:opacity-40"
            >
              {!sel
                ? "Select a card"
                : copied
                  ? "Copied ✓ — opening site…"
                  : barcode
                    ? "Copy card number & book →"
                    : "Book your pass on the library site →"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
