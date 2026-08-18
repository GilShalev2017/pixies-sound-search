'use client';

import { useCallback, useMemo } from 'react';
import { addSearchTerm, removeSearchTerm } from '@/lib/core/history';
import { createHistoryStore } from '@/lib/core/preferences';
import { usePersistentState } from './usePersistentState';

export interface SearchHistoryApi {
  readonly entries: readonly string[];
  remember(term: string): void;
  forget(term: string): void;
  clear(): void;
}

/** Stable references: the factory and the fallback must not change identity. */
const EMPTY: string[] = [];

/** Recent searches: list rules from `core/history`, persistence from `core/storage`. */
export function useSearchHistory(): SearchHistoryApi {
  const [entries, setEntries] = usePersistentState<string[]>(createHistoryStore, EMPTY);

  const remember = useCallback((term: string) => setEntries((current) => addSearchTerm(current, term)), [setEntries]);
  const forget = useCallback((term: string) => setEntries((current) => removeSearchTerm(current, term)), [setEntries]);
  const clear = useCallback(() => setEntries(EMPTY), [setEntries]);

  return useMemo(() => ({ entries, remember, forget, clear }), [entries, remember, forget, clear]);
}
