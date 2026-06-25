import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { AvailStatus } from "../lib/supply";
import { MonthCalendar } from "./MonthCalendar";

// iPhone-style date picker: slides up from the bottom. Rendered through a portal
// on document.body so it escapes the glass header's containing block (a
// backdrop-filter ancestor would otherwise pin `fixed` to the header). The grid
// itself is the shared MonthCalendar (also used inline on the detail page).
export function CalendarSheet({
  open,
  min,
  max,
  value,
  statusFor,
  title,
  onSelect,
  onClose,
}: {
  open: boolean;
  min: Date;
  max: Date;
  value: Date | null;
  statusFor?: (iso: string) => AvailStatus;
  title?: string;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[rgba(20,40,30,.4)]" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[440px] rounded-t-[20px] bg-white px-5 pt-2"
            style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto my-2.5 h-1 w-10 rounded-full bg-edge" />
            {title && <p className="px-1 pb-1 text-center text-[12px] font-medium text-ink-soft">{title}</p>}
            <MonthCalendar
              min={min}
              max={max}
              value={value}
              statusFor={statusFor}
              onSelect={(d) => { onSelect(d); onClose(); }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
