'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TypedStore } from '@/lib/core/storage';

export type PersistentStateResult<T> = readonly [
  value: T,
  setValue: (updater: T | ((current: T) => T)) => void,
  hydrated: boolean,
];

/**
 * `useState` that hydrates from a store *after* mount.
 *
 * Reading storage during render would desynchronise server and client HTML, so
 * the first paint always uses `fallback` and the persisted value arrives in an
 * effect (`hydrated` tells the UI when that has happened).
 */
export function usePersistentState<T>(storeFactory: () => TypedStore<T>, fallback: T): PersistentStateResult<T> {
  const factoryRef = useRef(storeFactory);
  factoryRef.current = storeFactory;

  const storeRef = useRef<TypedStore<T> | null>(null);
  const getStore = useCallback((): TypedStore<T> => (storeRef.current ??= factoryRef.current()), []);

  const [value, setValue] = useState<T>(fallback);
  const valueRef = useRef<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStore().read();
    valueRef.current = stored;
    setValue(stored);
    setHydrated(true);
  }, [getStore]);

  const update = useCallback(
    (updater: T | ((current: T) => T)) => {
      const next = typeof updater === 'function' ? (updater as (current: T) => T)(valueRef.current) : updater;
      valueRef.current = next;
      setValue(next);
      getStore().write(next);
    },
    [getStore],
  );

  return [value, update, hydrated] as const;
}
