// Save slots over any key-value store. The UI passes in localStorage; tests pass a Map.
// Before each write the previous save is copied to a backup slot.
import type { GameState } from '../state';
import { decodeSave, encodeSave, type LoadResult } from './codec';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SAVE_KEY = 'permits.save';
export const BACKUP_KEY = 'permits.save.bak';

export function writeSave(store: KeyValueStore, state: GameState, savedAt: number): void {
  const previous = store.getItem(SAVE_KEY);
  if (previous !== null) store.setItem(BACKUP_KEY, previous);
  store.setItem(SAVE_KEY, encodeSave(state, savedAt));
}

/** Loads the main save, falling back to the backup if the main one is damaged. */
export function readSave(store: KeyValueStore): LoadResult | null {
  const main = store.getItem(SAVE_KEY);
  if (main === null) return null;
  const result = decodeSave(main);
  if (result.ok) return result;
  const backup = store.getItem(BACKUP_KEY);
  if (backup !== null) {
    const fallback = decodeSave(backup);
    if (fallback.ok) return fallback;
  }
  return result;
}
