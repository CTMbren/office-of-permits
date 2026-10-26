// localStorage behind the core's KeyValueStore interface. Falls back to memory when storage
// is unavailable (private browsing, some embedded previews) so the game still runs.
import type { KeyValueStore } from '../core/save/store';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function localStore(): KeyValueStore | null {
  try {
    const probe = '__permits_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch {
    return null;
  }
  return {
    getItem: (k) => {
      try {
        return window.localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    setItem: (k, v) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* storage full or blocked: keep playing */
      }
    },
  };
}

const local = typeof window === 'undefined' ? null : localStore();

export const browserStore: KeyValueStore = local ?? memoryStore();
/** False when saves only last until the page closes. */
export const storageIsPersistent = local !== null;
