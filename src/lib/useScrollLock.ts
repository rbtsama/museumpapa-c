import { useEffect } from "react";

// Freeze the page behind a modal/sheet so the background can't scroll (or be
// swiped) through the overlay while it's open. Restores the prior value on close.
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
