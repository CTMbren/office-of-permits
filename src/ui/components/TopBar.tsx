import { game } from '../store';
import { formatNumber } from '../../core/format';
import { Candle, Coin, Eye, Gear } from '../icons';

const RANKS = ['Junior Clerk', 'Clerk', 'Senior Clerk', 'Head Clerk'];

export function TopBar({ onSettings }: { onSettings: () => void }) {
  const s = game.value;
  const shift = s.shift;
  const rank = RANKS[0];
  const shiftLabel = shift ? `Shift ${shift.no}` : s.shiftNo === 0 ? 'First day' : `Off shift`;

  return (
    <header class="topbar">
      <div>
        <h1 class="topbar__title">Office of Permits</h1>
        <div class="topbar__sub">
          {shiftLabel} · {rank}
        </div>
      </div>
      <div class="topbar__stats">
        {shift && (
          <div class="stat" title="Desk-minutes left this shift">
            <Candle left={shift.deskMinutesLeft} total={shift.deskMinutes} />
            <span>
              {shift.deskMinutesLeft}
              <span class="visually-hidden"> desk-minutes left</span>
            </span>
          </div>
        )}
        <div class="stat">
          <Coin />
          <span>
            {formatNumber(s.cur.coin)}
            <span class="visually-hidden"> coin</span>
          </span>
        </div>
        <div class="stat" title="The Auditor is not watching. Yet.">
          <Eye open={s.cur.suspicion / 100} />
          <span class="visually-hidden">Suspicion {s.cur.suspicion} of 100</span>
        </div>
        <button type="button" class="icon-button" aria-label="Settings and saves" onClick={onSettings}>
          <Gear />
        </button>
      </div>
    </header>
  );
}
