'use client';

import { useCallback, useMemo } from 'react';
import { addSearchTerm, removeSearchTerm } from '@/lib/core/history';
import { createHistoryStore } from '@/lib/core/preferences';
import { usePersistentState } from './usePersistentState';

export interface SearchHistoryApi {
  readonly entries: readonly string[];
  readonly hydrated: boolean;
  remember(term: string): void;
  forget(term: string): void;
  clear(): void;
}

/** Recent searches: pure list rules from `core/history`, persistence from `core/storage`. */
export function useSearchHistory(): SearchHistoryApi {
  const [entries, setEntries, hydrated] = usePersistentState<string[]>(() => createHistoryStore(), []);

  const remember = useCallback((term: string) => setEntries((current) => addSearchTerm(current, term)), [setEntries]);
  const forget = useCallback((term: string) => setEntries((current) => removeSearchTerm(current, term)), [setEntries]);
  const clear = useCallback(() => setEntries([]), [setEntries]);

  return useMemo(
    () => ({ entries, hydrated, remember, forget, clear }),
    [entries, hydrated, remember, forget, clear],
  );
}
