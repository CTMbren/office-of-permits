// Tunable numbers. In M2 these move to content/balance.yaml so the simulator can tune them
// without code changes; until then, keep every tunable here and nowhere else.

export const BALANCE = {
  shift: {
    /** The M1 slice runs a short shift; the full game uses `deskMinutes`. */
    deskMinutesSlice: 120,
    deskMinutes: 180,
  },
  actionMinutes: { stamp: 1, check: 1, approve: 2, deny: 2, request: 3, bribe: 0 },
} as const;
