// Inline SVG icons for the Parchment Desk. Decorative ones are aria-hidden.

export function Candle({ left, total }: { left: number; total: number }) {
  // The wax shrinks as desk-minutes are spent.
  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const wax = 6 + 22 * frac;
  const top = 34 - wax;
  return (
    <svg width="18" height="36" viewBox="0 0 18 36" aria-hidden="true">
      {frac > 0 && (
        <path d={`M9 ${top - 11} C12 ${top - 6} 12 ${top - 3} 9 ${top - 1} C6 ${top - 3} 6 ${top - 6} 9 ${top - 11} Z`} fill="var(--gold)" />
      )}
      <rect x="4" y={top} width="10" height={wax} rx="1.5" fill="#efe3c8" />
    </svg>
  );
}

export function Eye({ open }: { open: number }) {
  // open: 0 (closed) to 1 (wide). Suspicion drives this from M2.
  // A drowsy half-lid at zero; wide open at full Suspicion.
  const lid = 3 + 4 * Math.max(0, Math.min(1, open));
  return (
    <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
      <path d={`M1 8 C6 ${8 - lid} 20 ${8 - lid} 25 8 C20 ${8 + lid} 6 ${8 + lid} 1 8 Z`} fill="none" stroke="currentColor" stroke-width="1.5" />
      <circle cx="13" cy="8" r={Math.min(3.2, lid / 2)} fill="currentColor" />
    </svg>
  );
}

export function Coin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="var(--gold)" />
      <circle cx="8" cy="8" r="4.2" fill="none" stroke="var(--desk)" stroke-width="1.2" />
    </svg>
  );
}

export function Gear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke-linecap="round" />
    </svg>
  );
}

export function Seal() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
      <path
        d="M19 2 L23 6 L28 4 L29 10 L35 11 L33 17 L37 21 L32 24 L33 30 L27 30 L24 35 L19 32 L14 35 L11 30 L5 30 L6 24 L1 21 L5 17 L3 11 L9 10 L10 4 L15 6 Z"
        fill="var(--ink-red)"
      />
      <circle cx="19" cy="19" r="8" fill="none" stroke="var(--paper)" stroke-width="1.5" />
    </svg>
  );
}
