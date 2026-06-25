import { AnimatePresence, motion } from "framer-motion";
import { shareApp } from "../lib/share";
import { useScrollLock } from "../lib/useScrollLock";
import { useOverlay } from "../lib/useOverlay";

// Shown the moment a user taps Book (the library site opens in a new tab, this
// pops here at the same time). When they switch back it's already waiting — a
// warm "enjoy your visit + tell a friend" nudge that feeds the referral loop.
export function ShareInviteModal({
  open,
  attractionName,
  onClose,
}: {
  open: boolean;
  attractionName?: string;
  onClose: () => void;
}) {
  useScrollLock(open);
  useOverlay(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[rgba(8,22,16,.72)]" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[360px] rounded-[20px] bg-white p-5 pt-6 text-center shadow-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full text-[15px] text-ink-faint active:scale-95"
            >
              ✕
            </button>

            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-[30px]">💛</div>
            <h4 className="font-display text-[19px] font-bold text-ink">Enjoyed booking with us?</h4>
            <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] leading-relaxed text-ink-soft">
              Help a friend save at museums too.
            </p>

            <button
              onClick={() => { void shareApp(attractionName).finally(onClose); }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-brand py-3 text-[15px] font-bold text-white active:scale-[.99]"
            >
              <ShareGlyph />
              Share MuseumPapa
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
