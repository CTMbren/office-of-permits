import { game } from '../store';

/** The paper in the middle of the desk. M1 replaces the on-shift card with real cases. */
export function Desk() {
  const s = game.value;

  if (!s.shift) {
    return s.shiftNo === 0 ? <FirstMemo /> : <ShiftOverMemo no={s.shiftNo} />;
  }

  return (
    <article class="card" aria-live="polite">
      <div class="card__head">
        <span class="card__title">In-tray</span>
        <span class="card__no">Shift {s.shift.no}</span>
      </div>
      <p>The in-tray is empty. Somewhere below the floor, something hums.</p>
      <p class="card__sign">
        Cases begin arriving in the next build. For now, the candle burns all the same.
      </p>
    </article>
  );
}

function FirstMemo() {
  return (
    <article class="card">
      <div class="card__head">
        <span class="card__title">Memorandum</span>
        <span class="card__no">No. 0001</span>
      </div>
      <p>Welcome to the Office of Permits, junior clerk.</p>
      <p>
        Your predecessor, Clerk Venn, is on unauthorised leave. Her desk, chair and stapler are now
        yours. Please do not open the bottom drawer.
      </p>
      <p>Applicants make claims. Some of the claims are true. Stamp it.</p>
      <p class="card__sign">B. Nibb, Senior Clerk (acting)</p>
    </article>
  );
}

function ShiftOverMemo({ no }: { no: number }) {
  return (
    <article class="card">
      <div class="card__head">
        <span class="card__title">End of shift</span>
        <span class="card__no">Shift {no}</span>
      </div>
      <p>The candle is out. Nothing was approved, nothing was denied, and nothing collapsed.</p>
      <p class="card__sign">A clean record, if a short one.</p>
    </article>
  );
}
