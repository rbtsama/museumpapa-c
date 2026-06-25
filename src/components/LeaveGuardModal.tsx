import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "../lib/useScrollLock";

// Shown when the user tries to back / edge-swipe out of Home. Guards against an
// accidental exit and nudges a bookmark so they can find their passes again.
export function LeaveGuardModal({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  useScrollLock(open);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[rgba(8,22,16,.72)]" onClick={onStay} />
          <motion.div
            className="relative w-full max-w-[360px] rounded-[20px] bg-white p-5 pt-6 text-center shadow-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-[28px]">🔖</div>
            <h4 className="font-display text-[19px] font-bold text-ink">Bookmarked us yet?</h4>
            <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] leading-relaxed text-ink-soft">
              Save MuseumPapa so you don’t lose your way back. 😉
            </p>

            <button
              onClick={onStay}
              className="mt-4 w-full rounded-[12px] bg-brand py-3 text-[15px] font-bold text-white active:scale-[.99]"
            >
              Got it
            </button>
            <button
              onClick={onLeave}
              className="mt-2 w-full py-2 text-[13px] font-semibold text-ink-faint active:scale-[.99]"
            >
              Leave anyway
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
