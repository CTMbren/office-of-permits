// Number formatting for a text-heavy UI: exact below 10,000, then K/M/B/T, then scientific.

const UNITS = ['', 'K', 'M', 'B', 'T'] as const;

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 10_000) return sign + Math.floor(abs).toLocaleString('en-US');
  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < UNITS.length) {
    const scaled = abs / 10 ** (tier * 3);
    const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
    return `${sign}${trim(scaled.toFixed(digits))}${UNITS[tier]}`;
  }
  return sign + abs.toExponential(2).replace('e+', 'e');
}

function trim(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}
