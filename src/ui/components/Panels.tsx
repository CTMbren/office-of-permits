import { useState } from 'preact/hooks';
import content from '../../generated/content.json';
import { isWide } from '../media';

type Tab = 'rules' | 'tray' | 'map';

function Rules() {
  return (
    <section class="panel" aria-labelledby="rules-title">
      <h2 class="panel__title" id="rules-title">
        Rulebook
      </h2>
      {content.rules.map((r, i) => (
        <div class="slip" key={r.id}>
          <div class="slip__no">RULE {i + 1}</div>
          {r.text}
        </div>
      ))}
    </section>
  );
}

function Tray() {
  return (
    <section class="panel" aria-labelledby="tray-title">
      <h2 class="panel__title" id="tray-title">
        In-tray · 0 waiting
      </h2>
      <div class="panel__box">The Ledger fills in as you process cases.</div>
    </section>
  );
}

function BasementMap() {
  return (
    <section class="panel" aria-labelledby="map-title">
      <h2 class="panel__title" id="map-title">
        Basement Map
      </h2>
      <div class="panel__box">
        <svg width="100%" height="90" viewBox="0 0 240 90" role="img" aria-label="An empty grid">
          <g stroke="rgba(243,234,211,0.15)" stroke-width="1">
            <line x1="0" y1="30" x2="240" y2="30" />
            <line x1="0" y1="60" x2="240" y2="60" />
            <line x1="60" y1="0" x2="60" y2="90" />
            <line x1="120" y1="0" x2="120" y2="90" />
            <line x1="180" y1="0" x2="180" y2="90" />
          </g>
        </svg>
        Nothing plotted. Yet.
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
    ['tray', 'Tray'],
    ['map', 'Map'],
  ];
  return (
    <div class="panels">
      <div class="panels__tabs" role="tablist" aria-label="Desk drawers">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            class="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
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
