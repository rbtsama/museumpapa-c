// Small line icons (stroke currentColor) for location / time / tickets — a clean,
// consistent set reused across the cards.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PinIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ClockIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function TicketIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7.5h16a1 1 0 0 1 1 1v2a1.7 1.7 0 0 0 0 3.4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1.7 1.7 0 0 0 0-3.4v-2a1 1 0 0 1 1-1z" />
      <path d="M9 7.5v9" strokeDasharray="1.5 2" />
    </svg>
  );
}
