'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { searchKeys } from '@/lib/api/queryKeys';
import { searchTracks } from '@/lib/api/searchClient';
import {
  INITIAL_CURSOR_STATE,
  canGoNext,
  canGoPrev,
  currentCursor,
  goNext,
  goPrev,
  pageNumber,
  type CursorState,
} from '@/lib/core/pagination';
import { SearchError } from '@/lib/domain/errors';
import { PAGE_SIZE, type Track } from '@/lib/domain/track';

export interface TrackSearchResult {
  readonly items: readonly Track[];
  readonly providerLabel: string | null;
  readonly attribution: string | null;
  readonly page: number;
  readonly isIdle: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isEmpty: boolean;
  readonly error: unknown;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  goToNextPage(): void;
  goToPrevPage(): void;
  retry(): void;
}

/**
 * Owns everything about "which page of which search are we showing".
 *
 * Async correctness lives here:
 *  - the query key contains the term *and* the cursor, so a new search or page
 *    makes TanStack Query cancel the in-flight request (via the `signal` it
 *    passes to `queryFn`) and discard its answer — a slow response for an old
 *    term can never overwrite the current results;
 *  - paging is blocked while a page is in flight, so hammering Next/Previous
 *    cannot push a cursor that belongs to a page we are no longer on.
 */
export function useTrackSearch(term: string): TrackSearchResult {
  const queryClient = useQueryClient();

  // Cursor state belongs to a term; changing the term resets it in the same
  // render, so we never issue a request pairing a new term with an old cursor.
  const [state, setState] = useState<{ term: string; cursors: CursorState }>({
    term,
    cursors: INITIAL_CURSOR_STATE,
  });
  if (state.term !== term) {
    setState({ term, cursors: INITIAL_CURSOR_STATE });
  }
  const cursors = state.term === term ? state.cursors : INITIAL_CURSOR_STATE;
  const cursor = currentCursor(cursors);
  const enabled = term.trim().length > 0;

  const query = useQuery({
    queryKey: searchKeys.page(term, cursor),
    queryFn: ({ signal }) => searchTracks({ term, limit: PAGE_SIZE, cursor, signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) =>
      error instanceof SearchError && error.kind === 'network' && failureCount < 2,
  });

  const settled = !query.isFetching && !query.isPlaceholderData;
  const data = query.isPlaceholderData ? undefined : query.data;

  // Warm the next page so Next feels instantaneous.
  useEffect(() => {
    if (!settled || !data?.nextCursor) return;
    void queryClient.prefetchQuery({
      queryKey: searchKeys.page(term, data.nextCursor),
      queryFn: ({ signal }) => searchTracks({ term, limit: PAGE_SIZE, cursor: data.nextCursor, signal }),
      staleTime: 60_000,
    });
  }, [settled, data?.nextCursor, term, queryClient]);

  const goToNextPage = useCallback(() => {
    if (!settled) return;
    setState((current) => ({ ...current, cursors: goNext(current.cursors, data?.nextCursor ?? null) }));
  }, [settled, data?.nextCursor]);

  const goToPrevPage = useCallback(() => {
    if (!settled) return;
    setState((current) => ({ ...current, cursors: goPrev(current.cursors) }));
  }, [settled]);

  const items = query.isPlaceholderData ? [] : (query.data?.items ?? []);

  return {
    items,
    providerLabel: query.data?.provider.label ?? null,
    attribution: query.data?.provider.attribution ?? null,
    page: pageNumber(cursors),
    isIdle: !enabled,
    isLoading: enabled && (query.isPending || query.isPlaceholderData),
    isFetching: query.isFetching,
    isEmpty: enabled && settled && !query.isError && items.length === 0,
    error: query.isError ? query.error : null,
    canPrev: settled && canGoPrev(cursors),
    canNext: settled && items.length > 0 && canGoNext(cursors, data?.nextCursor ?? null),
    goToNextPage,
    goToPrevPage,
    retry: () => void query.refetch(),
  };
}
