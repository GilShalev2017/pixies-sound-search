'use client';

// Called once from SoundExplorer.tsx (`const reducedMotion =
// usePrefersReducedMotion()`) and threaded down as a prop to disable
// animation-heavy UI. Independent of usePersistentState.ts above - this
// reads a live OS/browser media query rather than anything stored by us,
// so there is nothing to persist.
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Motion is decoration; anyone who asked the OS to calm it down gets a static UI. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
