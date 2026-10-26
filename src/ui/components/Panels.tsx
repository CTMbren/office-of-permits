import { useState } from 'preact/hooks';
import { RULEBOOK } from '../../core/content';
import { PERMIT_INFO } from '../../core/cases/types';
import { BALANCE } from '../../core/balance';
import { game } from '../store';
import { isWide } from '../media';
import { endShift } from '../play';

type Tab = 'rules' | 'tray' | 'map';

function Rules() {
  return (
    <section class="panel" aria-labelledby="rules-title">
      <h2 class="panel__title" id="rules-title">
        Rulebook
      </h2>
      {RULEBOOK.map((r, i) => (
        <div class="slip" key={r.id}>
          <div class="slip__no">RULE {i + 1}</div>
          {r.text}
        </div>
      ))}
      <p class="panel__note">Anything no rule forbids is approved.</p>
    </section>
  );
}

function Tray() {
  const s = game.value;
  const shift = s.shift;
  const waiting = shift?.tray ?? [];
  const rows = Object.entries(s.ledger).filter(([, row]) => row && row.processed > 0);
  const bonus = shift ? Math.round(shift.streak * BALANCE.streak.perCorrect * 100) : 0;

  return (
    <section class="panel" aria-labelledby="tray-title">
      <h2 class="panel__title" id="tray-title">
        In-tray · {waiting.length} waiting
      </h2>
      {shift && (
        <div class="panel__box">
          {waiting.length === 0 ? 'Nobody else in the queue.' : waiting.slice(0, 4).map((c) => PERMIT_INFO[c.permit].title).join(', ')}
          {waiting.length > 4 && ` and ${waiting.length - 4} more`}
          <div class="panel__streak">Streak bonus: +{bonus}% on signed fees</div>
        </div>
      )}
      <h2 class="panel__title">Ledger</h2>
      <div class="panel__box">
        {rows.length === 0 ? (
          'The Ledger fills in as you process cases.'
        ) : (
          <table class="ledger">
            <thead>
              <tr>
                <th scope="col">Permit</th>
                <th scope="col">Seen</th>
                <th scope="col">Found bad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([permit, row]) => (
                <tr key={permit}>
                  <td>{PERMIT_INFO[permit as keyof typeof PERMIT_INFO].title}</td>
                  <td>{row!.processed}</td>
                  <td>{Math.round((row!.bad / row!.processed) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {shift && (
        <button type="button" class="btn btn--ghost" onClick={endShift}>
          End shift early
        </button>
      )}
    </section>
  );
}

function BasementMap() {
  const plotted = game.value.flags['story.grell_basement_case'] === 1;
  return (
    <section class="panel" aria-labelledby="map-title">
      <h2 class="panel__title" id="map-title">
        Basement Map
      </h2>
      <div class="panel__box">
        <svg width="100%" height="90" viewBox="0 0 240 90" role="img" aria-label={plotted ? 'One point plotted' : 'An empty grid'}>
          <g stroke="rgba(243,234,211,0.15)" stroke-width="1">
            <line x1="0" y1="30" x2="240" y2="30" />
            <line x1="0" y1="60" x2="240" y2="60" />
            <line x1="60" y1="0" x2="60" y2="90" />
            <line x1="120" y1="0" x2="120" y2="90" />
            <line x1="180" y1="0" x2="180" y2="90" />
          </g>
          {plotted && <circle cx="104" cy="52" r="4" fill="var(--gold)" />}
        </svg>
        {plotted ? 'One point. Beneath Sallow Lane.' : 'Nothing plotted. Yet.'}
      </div>
    </section>
  );
}

/** Wide screens: rules on the left, tray and map on the right. Phones: one tabbed panel. */
export function Panels({ side }: { side: 'left' | 'right' | 'mobile' }) {
  const [tab, setTab] = useState<Tab>('rules');

  if (side === 'left') return isWide.value ? <div class="panels panels--left"><Rules /></div> : null;
  if (side === 'right')
    return isWide.value ? (
      <div class="panels panels--right">
        <Tray />
        <BasementMap />
      </div>
    ) : null;
  if (isWide.value) return null;

  const tabs: [Tab, string][] = [
    ['rules', 'Rules'],
    ['tray', 'Tray & Ledger'],
    ['map', 'Map'],
  ];
  return (
    <div class="panels">
      <div class="panels__tabs" role="tablist" aria-label="Desk drawers">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" class="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'rules' && <Rules />}
        {tab === 'tray' && <Tray />}
        {tab === 'map' && <BasementMap />}
      </div>
    </div>
  );
}
