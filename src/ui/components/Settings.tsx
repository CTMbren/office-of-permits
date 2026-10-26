import { useEffect, useRef, useState } from 'preact/hooks';
import { exportText, importText, resetGame } from '../store';
import { storageIsPersistent } from '../storage';

/** A bottom sheet for saves: export, import, reset. Doubles as a test tool on iPhone. */
export function Settings({ onClose }: { onClose: () => void }) {
  const [exported, setExported] = useState('');
  const [pasted, setPasted] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const doExport = async () => {
    const text = exportText();
    setExported(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false); // the text is shown below for manual copying
    }
  };

  const doImport = () => {
    if (importText(pasted)) onClose();
  };

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="sheet__head">
          <h2 id="settings-title">Saves</h2>
          <button type="button" class="btn btn--ghost sheet__close" ref={closeRef} onClick={onClose}>
            Close
          </button>
        </div>

        {!storageIsPersistent && (
          <p class="sheet__warn">
            This browser is not keeping saves. Export your save before closing the page.
          </p>
        )}

        <section class="sheet__section">
          <h3>Export</h3>
          <p>Copies your save as text you can keep in Notes or send to another device.</p>
          <button type="button" class="btn" onClick={doExport}>
            Export save
          </button>
          {exported && (
            <>
              <p class="sheet__ok">{copied ? 'Copied to the clipboard.' : 'Copy the text below.'}</p>
              <textarea class="sheet__text" readOnly rows={3} value={exported} aria-label="Exported save" />
            </>
          )}
        </section>

        <section class="sheet__section">
          <h3>Import</h3>
          <label class="sheet__label" for="import-text">
            Paste a save that starts with OOP1
          </label>
          <textarea
            id="import-text"
            class="sheet__text"
            rows={3}
            value={pasted}
            onInput={(e) => setPasted((e.target as HTMLTextAreaElement).value)}
          />
          <button type="button" class="btn" disabled={pasted.trim() === ''} onClick={doImport}>
            Import save
          </button>
        </section>

        <section class="sheet__section">
          <h3>Start over</h3>
          {confirmReset ? (
            <div class="sheet__row">
              <button
                type="button"
                class="btn btn--deny"
                onClick={() => {
                  resetGame();
                  onClose();
                }}
              >
                Erase and restart
              </button>
              <button type="button" class="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                Keep playing
              </button>
            </div>
          ) : (
            <button type="button" class="btn btn--ghost" onClick={() => setConfirmReset(true)}>
              Reset game
            </button>
          )}
        </section>

        <p class="sheet__meta">Office of Permits · build M0</p>
      </div>
    </div>
  );
}
