// Shared sub-page header: glass bar with a back button + title. Used by every
// sub-page (Account, card picker, …) so they look consistent.
export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-[#eadccb] px-3 py-3">
      <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <h1 className="font-display text-[18px] font-semibold">{title}</h1>
    </header>
  );
}
