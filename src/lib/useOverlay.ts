import { useEffect, useRef } from "react";

// A tiny LIFO stack of "close the topmost open overlay" callbacks. App's single
// history/popstate handler pops the top one on Back / edge-swipe, so a gesture
// dismisses the open sheet (calendar, book, share…) FIRST instead of falling
// through to the previous page.
const stack: Array<() => void> = [];

export function pushOverlay(close: () => void): () => void {
  stack.push(close);
  return () => {
    const i = stack.lastIndexOf(close);
    if (i >= 0) stack.splice(i, 1);
  };
}

// Close the topmost overlay if any; returns whether one was handled.
export function popOverlay(): boolean {
  const close = stack.pop();
  if (close) {
    close();
    return true;
  }
  return false;
}

// Register a sheet/modal so the browser Back gesture closes it. `onClose` is read
// fresh each time (kept in a ref) so it never goes stale.
export function useOverlay(open: boolean, onClose: () => void) {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open) return;
    return pushOverlay(() => cb.current());
  }, [open]);
}
