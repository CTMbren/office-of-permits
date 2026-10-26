import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame } from '../src/core/state';
import { reduce } from '../src/core/reduce';
import { decodeSave, encodeSave, exportSave, importSave } from '../src/core/save/codec';
import { BACKUP_KEY, readSave, SAVE_KEY, writeSave, type KeyValueStore } from '../src/core/save/store';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const midShift = reduce(reduce(newGame(1337), { t: 'startShift' }), { t: 'spendMinutes', minutes: 30 });

describe('save codec', () => {
  it('round-trips a mid-shift state', () => {
    const result = decodeSave(encodeSave(midShift, 1000));
    expect(result).toEqual({ ok: true, state: midShift });
  });

  it('refuses saves from a newer version', () => {
    const text = JSON.stringify({ v: 999, savedAt: 0, state: midShift });
    expect(decodeSave(text).ok).toBe(false);
  });

  it('refuses damaged state instead of half-loading', () => {
    const text = JSON.stringify({ v: 1, savedAt: 0, state: { ...midShift, cur: null } });
    const result = decodeSave(text);
    expect(result.ok).toBe(false);
  });

  it('loads every fixture save', () => {
    const fixture = readFileSync('tests/fixtures/saves/save_v1.json', 'utf8');
    const result = decodeSave(fixture);
    expect(result.ok).toBe(true);
  });
});

describe('export and import', () => {
  it('round-trips through the text format', () => {
    const text = exportSave(midShift, 5);
    expect(text.startsWith('OOP1.')).toBe(true);
    expect(importSave(text)).toEqual({ ok: true, state: midShift });
  });

  it('detects truncated or altered text', () => {
    const text = exportSave(midShift, 5);
    expect(importSave(text.slice(0, -3)).ok).toBe(false);
    expect(importSave('hello').ok).toBe(false);
  });
});

describe('save store', () => {
  it('keeps the previous save as a backup', () => {
    const store = memoryStore();
    writeSave(store, newGame(1), 1);
    writeSave(store, midShift, 2);
    expect(store.data.has(BACKUP_KEY)).toBe(true);
    expect(readSave(store)).toEqual({ ok: true, state: midShift });
  });

  it('falls back to the backup when the main save is damaged', () => {
    const store = memoryStore();
    writeSave(store, midShift, 1);
    writeSave(store, midShift, 2);
    store.setItem(SAVE_KEY, '{broken');
    expect(readSave(store)).toEqual({ ok: true, state: midShift });
  });

  it('returns null when there is no save', () => {
    expect(readSave(memoryStore())).toBeNull();
  });
});
