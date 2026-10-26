import { useState } from 'preact/hooks';
import { notice } from './store';
import { TopBar } from './components/TopBar';
import { Desk } from './components/Desk';
import { Panels } from './components/Panels';
import { ActionBar } from './components/ActionBar';
import { Settings } from './components/Settings';
import { isWide } from './media';

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div class="app">
      <TopBar onSettings={() => setSettingsOpen(true)} />

      {notice.value && (
        <div class="notice" role="status">
          <span>{notice.value}</span>
          <button type="button" aria-label="Dismiss" onClick={() => (notice.value = null)}>
            ✕
          </button>
        </div>
      )}

      <main class="desk">
        <Panels side="left" />
        <div class="desk__center">
          <Desk />
          {isWide.value && <ActionBar />}
        </div>
        <Panels side="right" />
        <Panels side="mobile" />
      </main>

      {!isWide.value && <ActionBar />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
