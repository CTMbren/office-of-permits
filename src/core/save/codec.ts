// Save encoding, versioned migrations, and the export/import text format.
// Every change to GameState's shape needs: SAVE_VERSION bumped, a migration here,
// and a fixture in tests/fixtures/saves/ that must keep loading.
import { SAVE_VERSION, type GameState } from '../state';
import { GameStateSchema, SaveFileSchema } from './schema';

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a version-n state to version n+1. */
export const migrations: Record<number, Migration> = {
  // 1: (s) => ({ ...s, v: 2, newField: defaultValue }),
};

export type LoadResult = { ok: true; state: GameState } | { ok: false; error: string };

export function encodeSave(state: GameState, savedAt: number): string {
  return JSON.stringify({ v: state.v, savedAt, state });
}

export function decodeSave(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Save is not valid JSON.' };
  }
  const file = SaveFileSchema.safeParse(raw);
  if (!file.success) return { ok: false, error: 'Save file is missing its version or state.' };
  if (file.data.v > SAVE_VERSION) {
    return { ok: false, error: `Save is from a newer version (${file.data.v}) of the game.` };
  }

  let state = file.data.state as Record<string, unknown>;
  for (let v = file.data.v; v < SAVE_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) return { ok: false, error: `No migration from save version ${v}.` };
    state = migrate(state);
  }

  const parsed = GameStateSchema.safeParse(state);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `Save is damaged at ${first?.path.join('.') ?? '?'}.` };
  }
  return { ok: true, state: parsed.data as GameState };
}

// ---- Export / import: base64 text with a checksum, safe to paste into a note or email. ----

const PREFIX = 'OOP1';

export function exportSave(state: GameState, savedAt: number): string {
  const json = encodeSave(state, savedAt);
  return `${PREFIX}.${toBase64(json)}.${checksum(json)}`;
}

export function importSave(text: string): LoadResult {
  const parts = text.trim().split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    return { ok: false, error: 'That does not look like an Office of Permits save.' };
  }
  let json: string;
  try {
    json = fromBase64(parts[1] ?? '');
  } catch {
    return { ok: false, error: 'The save text is incomplete.' };
  }
  if (checksum(json) !== parts[2]) return { ok: false, error: 'The save text was altered or cut off.' };
  return decodeSave(json);
}

/** FNV-1a, 32-bit, as 8 hex digits. Detects truncation and typos, not tampering. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
