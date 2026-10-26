import { game } from '../store';
import { departing } from '../play';
import { CaseCard } from './CaseCard';
import { ReportCard } from './ReportCard';

/** The paper in the middle of the desk. */
export function Desk() {
  const s = game.value;
  const shift = s.shift;

  if (!shift) {
    if (s.lastReport) return <ReportCard report={s.lastReport} />;
    return <FirstMemo />;
  }

  const leaving = departing.value;
  return (
    <div class={`desk__stack${leaving ? ' desk__stack--busy' : ''}`} aria-live="polite">
      {shift.current ? (
        <CaseCard key={shift.current.no} c={shift.current} checked={shift.checked} live={true} extraClass="case--in" />
      ) : (
        <EmptyTray minutes={Math.max(1, shift.nextArrivalAt - shift.elapsed)} />
      )}
      {leaving && (
        <CaseCard
          key={`out-${leaving.key}`}
          c={leaving.c}
          checked={leaving.checked}
          live={false}
          stamp={leaving.verdict}
          extraClass={`case--out case--out-${leaving.verdict}`}
        />
      )}
    </div>
  );
}

function EmptyTray({ minutes }: { minutes: number }) {
  return (
    <article class="card case--in">
      <div class="card__head">
        <span class="card__title">In-tray</span>
      </div>
      <p>The in-tray is empty. Somewhere below the floor, something hums.</p>
      <p class="card__sign">
        The next applicant is due in about {minutes} desk-minute{minutes === 1 ? '' : 's'}.
      </p>
    </article>
  );
}

function FirstMemo() {
  return (
    <article class="card">
      <div class="card__head">
        <span class="card__title">Memorandum</span>
        <span class="card__no">No. 0000</span>
      </div>
      <p>Welcome to the Office of Permits, junior clerk.</p>
      <p>
        Your predecessor, Clerk Venn, is on unauthorised leave. Her desk, chair and stapler are now
        yours. Please do not open the bottom drawer.
      </p>
      <p>
        Applicants make claims. Some of the claims are true. Tap a field to check it against the
        records; it costs a desk-minute. Then approve or deny. Or stamp it and hope.
      </p>
      <p class="card__sign">B. Nibb, Senior Clerk (acting)</p>
    </article>
  );
}
