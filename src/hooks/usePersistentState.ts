'use client';

// Not called directly by any component - it's the shared plumbing behind
// two other hooks in this folder, useViewMode.ts and useSearchHistory.ts,
// each of which passes it its own read()/write() pair from
// src/lib/core/preferences.ts. This file only knows how to bind an
// arbitrary read/write pair to React via useSyncExternalStore; it has no
// idea what "view mode" or "search history" mean.
import { useCallback, useRef, useSyncExternalStore } from 'react';

export type PersistentStateResult<T> = readonly [value: T, setValue: (updater: T | ((current: T) => T)) => void];

/**
 * State that lives in a store outside React (here: localStorage, via `read`/`write`).
 *
 * `useSyncExternalStore` is the right primitive here: during server rendering
 * and hydration React uses the server snapshot (so markup matches), then swaps
 * in the persisted value — no `useEffect` dance, no hydration warning, and open
 * tabs stay in sync through `storage` events.
 */
export function usePersistentState<T>(
  key: string,
  read: () => T,
  write: (value: T) => void,
  fallback: T,
): PersistentStateResult<T> {
  // Caches the last-read value so getSnapshot returns a referentially stable
  // result between renders, as useSyncExternalStore requires.
  const cacheRef = useRef<{ value: T } | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      listenersRef.current.add(onStoreChange);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        cacheRef.current = null;
        onStoreChange();
      };
      window.addEventListener('storage', onStorage);

      return () => {
        listenersRef.current.delete(onStoreChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    cacheRef.current ??= { value: read() };
    return cacheRef.current.value;
  }, [read]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => fallback, // server + first hydration render
  );

  const setValue = useCallback(
    (updater: T | ((current: T) => T)) => {
      const current = cacheRef.current?.value ?? read();
      const next = typeof updater === 'function' ? (updater as (current: T) => T)(current) : updater;
      cacheRef.current = { value: next };
      write(next);
      listenersRef.current.forEach((listener) => listener());
    },
    [read, write],
  );

  return [value, setValue] as const;
}
