// The UI's single source of game state. Components read `game.value` and call dispatch();
// dispatch runs the pure reducer and schedules an autosave.
import { signal } from '@preact/signals';
import type { Action } from '../core/actions';
import { reduce } from '../core/reduce';
import { newGame, type GameState } from '../core/state';
import { readSave, writeSave } from '../core/save/store';
import { exportSave, importSave } from '../core/save/codec';
import { browserStore } from './storage';

const AUTOSAVE_MS = 30_000;

function freshSeed(): number {
  // The UI may use real randomness to pick a seed; the core never does.
  return Math.floor(Math.random() * 2 ** 31);
}

function initialState(): { state: GameState; notice: string | null } {
  const loaded = readSave(browserStore);
  if (loaded === null) return { state: newGame(freshSeed()), notice: null };
  if (loaded.ok) return { state: loaded.state, notice: null };
  return { state: newGame(freshSeed()), notice: `Your save could not be loaded: ${loaded.error}` };
}

const init = initialState();
export const game = signal<GameState>(init.state);
/** A one-line message for the player (load errors, import results). */
export const notice = signal<string | null>(init.notice);

export function dispatch(action: Action): void {
  const next = reduce(game.value, action);
  if (next === game.value) return;
  game.value = next;
  // Shift boundaries are natural save points.
  if (action.t === 'startShift' || action.t === 'endShift' || next.shift === null) save();
}

export function save(): void {
  writeSave(browserStore, game.value, Date.now());
}

export function exportText(): string {
  return exportSave(game.value, Date.now());
}

export function importText(text: string): boolean {
  const result = importSave(text);
  if (!result.ok) {
    notice.value = result.error;
    return false;
  }
  game.value = result.state;
  save();
  notice.value = 'Save imported.';
  return true;
}

export function resetGame(): void {
  game.value = newGame(freshSeed());
  save();
  notice.value = 'A fresh desk. Your predecessor left in a hurry.';
}

// Autosave every 30 seconds and whenever the app is hidden (iOS may kill a backgrounded tab).
if (typeof window !== 'undefined') {
  window.setInterval(save, AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
  window.addEventListener('pagehide', save);
}
