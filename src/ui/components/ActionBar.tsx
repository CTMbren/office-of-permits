import { useEffect } from 'preact/hooks';
import { dispatch, game } from '../store';
import { isWide } from '../media';

/** Bottom action bar (thumb reach on iPhone). M1 adds Stamp, Check, Approve and Deny. */
export function ActionBar() {
  const onShift = game.value.shift !== null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' && !game.value.shift) {
        e.preventDefault();
        dispatch({ t: 'startShift' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const keys = isWide.value;

  if (!onShift) {
    return (
      <div class="actions">
        <button type="button" class="btn btn--approve" onClick={() => dispatch({ t: 'startShift' })}>
          Begin shift {game.value.shiftNo + 1}
          {keys && <span class="btn__key">Space</span>}
        </button>
      </div>
    );
  }

  return (
    <div class="actions">
      <button type="button" class="btn" onClick={() => dispatch({ t: 'spendMinutes', minutes: 10 })}>
        Wait 10 min
      </button>
      <button type="button" class="btn btn--ghost" onClick={() => dispatch({ t: 'endShift' })}>
        End shift
      </button>
    </div>
  );
}
