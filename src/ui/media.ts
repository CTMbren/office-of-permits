// A signal that tracks whether the wide (three-column) desk layout applies.
import { signal } from '@preact/signals';

const QUERY = '(min-width: 900px)';

export const isWide = signal(typeof window !== 'undefined' && window.matchMedia(QUERY).matches);

if (typeof window !== 'undefined') {
  window.matchMedia(QUERY).addEventListener('change', (e) => {
    isWide.value = e.matches;
  });
}
