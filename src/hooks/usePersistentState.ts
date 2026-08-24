'use client';

// Not called directly by any component - it's the shared plumbing behind
// two other hooks in this folder, useViewMode.ts and useSearchHistory.ts,
// each of which passes it a store factory from src/lib/core/preferences.ts
// (which in turn wraps src/lib/core/storage.ts, the localStorage-backed
// store). This file only knows how to bind an arbitrary external store to
// React; it has no idea what "view mode" or "search history" mean.
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createReactiveStore, type TypedStore } from '@/lib/core/storage';

export type PersistentStateResult<T> = readonly [value: T, setValue: (updater: T | ((current: T) => T)) => void];

/**
 * State that lives in a store outside React.
 *
 * `useSyncExternalStore` is the right primitive here: during server rendering
 * and hydration React uses the server snapshot (so markup matches), then swaps
 * in the persisted value — no `useEffect` dance, no hydration warning, and open
 * tabs stay in sync through `storage` events.
 */
export function usePersistentState<T>(storeFactory: () => TypedStore<T>, fallback: T): PersistentStateResult<T> {
  const store = useMemo(() => createReactiveStore(storeFactory()), [storeFactory]);

  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => fallback, // server + first hydration render
  );

  const setValue = useCallback(
    (updater: T | ((current: T) => T)) => {
      const next = typeof updater === 'function' ? (updater as (current: T) => T)(store.getSnapshot()) : updater;
      store.set(next);
    },
    [store],
  );

  return [value, setValue] as const;
}
