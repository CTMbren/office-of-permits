// Tunable numbers. In M2 these move to content/balance.yaml so the simulator can tune them
// without code changes; until then, keep every tunable here and nowhere else.

export const BALANCE = {
  shift: {
    /** The M1 slice runs a short shift; the full game uses `deskMinutes`. */
    deskMinutesSlice: 120,
    deskMinutes: 180,
    /** A new applicant joins the tray every N desk-minutes. */
    arrivalEvery: 3,
    initialTray: 3,
    maxTray: 12,
  },
  actionMinutes: { stamp: 1, check: 1, approve: 2, deny: 2, request: 3, bribe: 0 },

  pay: { stamp: 0.7, approve: 1.0, deny: 0.4 },
  standing: { approveRight: 1, deniedValid: -2, denyRight: 2, surfaced: -3 },
  streak: { perCorrect: 0.05, cap: 0.5 },
  suspicion: { surfaced: 3 },

  /** Chance a bad case you let through comes back by the end-of-shift report. */
  surface: { stamped: 0.45, signed: 0.66 },

  /** Per permit: fee, share of applicants who are invalid, fine if a mistake surfaces. */
  permits: {
    bakery: { fee: 6, invalid: 0.05, fineMult: 2, weight: 0.4 },
    tower: { fee: 12, invalid: 0.25, fineMult: 3, weight: 0.35 },
    dragon: { fee: 20, invalid: 0.45, fineMult: 4, weight: 0.25 },
    basement: { fee: 12, invalid: 0, fineMult: 1, weight: 0 },
  },
  /** Of invalid applicants, the share who openly break a rule on the card (no check needed). */
  honestViolation: 0.2,
  /** Where invalid applicants hide their lie, by field (weights per permit). */
  defects: {
    bakery: { sign_m: 0.7, seal: 0.3 },
    tower: { floors: 0.6, seal: 0.4 },
    dragon: { dwelling: 0.5, species: 0.25, seal: 0.25 },
  },
  letterChance: 0.35,

  ranks: [
    { name: 'Junior Clerk', standing: 0 },
    { name: 'Clerk', standing: 40 },
    { name: 'Senior Clerk', standing: 120 },
    { name: 'Head Clerk', standing: 300 },
  ],
} as const;

export function rankFor(standing: number): string {
  let name: string = BALANCE.ranks[0].name;
  for (const r of BALANCE.ranks) if (standing >= r.standing) name = r.name;
  return name;
}
