import { useEffect } from 'preact/hooks';
import { game } from '../store';
import { isWide } from '../media';
import { decide, checkField, endShift, startShift, toggleLetter, waitForNext } from '../play';
import { checkableFields } from '../../core/cases/types';
import { toggleMute } from '../sound';

function onKey(e: KeyboardEvent): void {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  const shift = game.value.shift;
  const c = shift?.current;
  const key = e.key.toLowerCase();

  if (key === 'm') return toggleMute();
  if (!shift) {
    if (key === ' ' || key === 'enter') {
      e.preventDefault();
      startShift();
    }
    return;
  }
  if (!c) {
    if (key === 'w' || key === ' ') {
      e.preventDefault();
      waitForNext();
    }
    return;
  }
  if (key === 's') decide('stamp');
  else if (key === 'a') decide('approve');
  else if (key === 'd') decide('deny');
  else if (key === ' ' && c.letterId) {
    e.preventDefault();
    toggleLetter(c.no);
  } else if (/^[1-9]$/.test(key)) {
    const field = checkableFields(c)[Number(key) - 1];
    if (field) checkField(field);
  }
}

/** Bottom action bar (thumb reach on iPhone); inline under the card on wide screens. */
export function ActionBar() {
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const s = game.value;
  const keys = isWide.value;
  const k = (label: string) => (keys ? <span class="btn__key">{label}</span> : null);

  if (!s.shift) {
    return (
      <div class="actions">
        <button type="button" class="btn btn--approve" onClick={startShift}>
          Begin shift {s.shiftNo + 1}
          {k('Space')}
        </button>
      </div>
    );
  }

  if (!s.shift.current) {
    return (
      <div class="actions">
        <button type="button" class="btn" onClick={waitForNext}>
          Wait for the next applicant{k('W')}
        </button>
        <button type="button" class="btn btn--ghost btn--narrow" onClick={endShift}>
          End shift
        </button>
      </div>
    );
  }

  return (
    <div class="actions">
      <button type="button" class="btn btn--stamp" onClick={() => decide('stamp')} aria-label="Stamp unread, 1 desk-minute, 70% of the fee">
        Stamp{k('S')}
        <span class="btn__cost">1 min</span>
      </button>
      <button type="button" class="btn btn--approve" onClick={() => decide('approve')} aria-label="Approve, 2 desk-minutes">
        Approve{k('A')}
        <span class="btn__cost">2 min</span>
      </button>
      <button type="button" class="btn btn--deny" onClick={() => decide('deny')} aria-label="Deny, 2 desk-minutes">
        Deny{k('D')}
        <span class="btn__cost">2 min</span>
      </button>
    </div>
  );
}
