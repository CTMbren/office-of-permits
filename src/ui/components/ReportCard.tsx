import type { ShiftReport } from '../../core/state';
import { formatNumber } from '../../core/format';

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** The end-of-shift ledger page. Lines appear one by one, typewriter style. */
export function ReportCard({ report }: { report: ShiftReport }) {
  const accuracy = report.cases > 0 ? Math.round((report.correct / report.cases) * 100) : 100;
  const rows: [string, string][] = [
    ['Cases handled', String(report.cases)],
    ['Correct', `${accuracy}%`],
    ['Stamped', String(report.stamped)],
    ['Coin earned', formatNumber(report.coinEarned)],
    ['Fines', report.fines > 0 ? `-${formatNumber(report.fines)}` : '0'],
    ['Standing', signed(report.standingChange)],
    ['Best streak', String(report.streakPeak)],
  ];

  return (
    <article class="card report">
      <div class="card__head">
        <span class="card__title">End of shift</span>
        <span class="card__no">Shift {report.shiftNo}</span>
      </div>
      <dl class="report__grid">
        {rows.map(([k, v]) => (
          <div class="report__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h3 class="report__heading">Since you signed</h3>
      {report.lines.length === 0 ? (
        <p class="card__sign">Nothing has collapsed, caught fire, or written to complain. Yet.</p>
      ) : (
        <ul class="report__lines">
          {report.lines.map((line, i) => (
            <li key={i} style={{ animationDelay: `${200 + i * 260}ms` }}>
              {line}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
