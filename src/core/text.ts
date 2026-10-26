// Fills `{slot}` placeholders. Unknown slots are left visible so tests can catch them.

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

/** Case numbers print as four digits: 7 → "0007". */
export function caseNo(n: number): string {
  return String(n).padStart(4, '0');
}
