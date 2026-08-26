// Exercises useTrackSearch.ts's async correctness claims (see that file's
// header) - the query-key-includes-cursor cancellation behaviour, and the
// nav lock that blocks paging until a page has settled. Uses a hand-rolled
// fetch stub (below) instead of a real network mock, so the test can
// resolve responses out of order and prove races are actually handled.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Track } from '@/lib/domain/track';
import { useTrackSearch } from './useTrackSearch';

/* -------------------------------------------------------------------------- */
/* A fetch stub whose responses we resolve by hand, so we can interleave them.  */
/* -------------------------------------------------------------------------- */

interface PendingRequest {
  term: string;
  cursor: string | null;
  signal: AbortSignal | null;
  resolve: () => void;
}

let pending: PendingRequest[] = [];

function track(id: string): Track {
  return {
    id,
    title: id,
    author: 'someone',
    url: 'https://example.com',
    artwork: { small: null, large: null },
    durationSec: null,
    playCount: null,
    publishedAt: null,
    tags: [],
    embedUrl: null,
  };
}

function body(term: string, cursor: string | null) {
  return {
    items: [track(`${term}-${cursor ?? 'p1'}`)],
    nextCursor: cursor === 'c2' ? null : cursor === 'c1' ? 'c2' : 'c1',
    prevCursor: cursor ? 'c0' : null,
    provider: { id: 'test', label: 'Test', attribution: 'test data' },
  };
}

function installFetchStub() {
  pending = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const term = url.searchParams.get('q') ?? '';
      const cursor = url.searchParams.get('cursor');

      return new Promise<Response>((resolve, reject) => {
        const request: PendingRequest = {
          term,
          cursor,
          signal: init?.signal ?? null,
          resolve: () =>
            resolve(new Response(JSON.stringify(body(term, cursor)), { headers: { 'content-type': 'application/json' } })),
        };
        pending.push(request);
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    }),
  );
}

function settle(term: string) {
  const request = pending.find((entry) => entry.term === term);
  if (!request) throw new Error(`no in-flight request for "${term}"`);
  pending = pending.filter((entry) => entry !== request);
  request.resolve();
}

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  installFetchStub();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => vi.unstubAllGlobals());

describe('useTrackSearch', () => {
  it('does not search until there is a term', () => {
    const { result } = renderHook(() => useTrackSearch(''), { wrapper });

    expect(result.current.isIdle).toBe(true);
    expect(pending).toHaveLength(0);
  });

  it('a slow response for an old term never overwrites the current results', async () => {
    const { result, rerender } = renderHook(({ term }) => useTrackSearch(term), {
      wrapper,
      initialProps: { term: 'slow' },
    });

    await waitFor(() => expect(pending.some((request) => request.term === 'slow')).toBe(true));

    // The user keeps typing before the first search resolves.
    rerender({ term: 'fast' });
    await waitFor(() => expect(pending.some((request) => request.term === 'fast')).toBe(true));

    await act(async () => settle('fast'));
    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['fast-p1']));

    // …and only now does the stale request come back.
    await act(async () => {
      const stale = pending.find((request) => request.term === 'slow');
      stale?.resolve();
      await Promise.resolve();
    });

    expect(result.current.items.map((item) => item.id)).toEqual(['fast-p1']);
  });

  it('resets to page one when the term changes', async () => {
    const { result, rerender } = renderHook(({ term }) => useTrackSearch(term), {
      wrapper,
      initialProps: { term: 'first' },
    });

    await act(async () => settle('first'));
    await waitFor(() => expect(result.current.canNext).toBe(true));

    act(() => result.current.goToNextPage());
    await act(async () => settle('first'));
    await waitFor(() => expect(result.current.page).toBe(2));

    rerender({ term: 'second' });
    expect(result.current.page).toBe(1);
  });

  it('ignores Next/Previous while a page is in flight, so the cursor cannot run ahead', async () => {
    const { result } = renderHook(() => useTrackSearch('adele'), { wrapper });

    await act(async () => settle('adele'));
    await waitFor(() => expect(result.current.canNext).toBe(true));

    // Hammer the button: the first click starts page 2, the rest must be ignored.
    act(() => {
      result.current.goToNextPage();
      result.current.goToNextPage();
      result.current.goToNextPage();
    });

    expect(result.current.page).toBe(2);
    expect(result.current.canNext).toBe(false);
    expect(result.current.canPrev).toBe(false);

    await act(async () => settle('adele'));
    await waitFor(() => expect(result.current.canPrev).toBe(true));

    act(() => result.current.goToPrevPage());
    expect(result.current.page).toBe(1);
  });

  it('stops offering Next once the provider runs out of cursors', async () => {
    const { result } = renderHook(() => useTrackSearch('adele'), { wrapper });

    await act(async () => settle('adele'));
    await waitFor(() => expect(result.current.canNext).toBe(true));

    act(() => result.current.goToNextPage());
    await act(async () => settle('adele'));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.goToNextPage());
    await act(async () => settle('adele'));
    await waitFor(() => expect(result.current.page).toBe(3));
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(result.current.canNext).toBe(false);
  });

  it('reports an empty result set instead of a blank page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ items: [], nextCursor: null, prevCursor: null, provider: { id: 't', label: 'T', attribution: '' } }),
            { headers: { 'content-type': 'application/json' } },
          ),
      ),
    );

    const { result } = renderHook(() => useTrackSearch('nothing'), { wrapper });

    await waitFor(() => expect(result.current.isEmpty).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error with a retry path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { kind: 'upstream', message: 'boom' } }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );

    const { result } = renderHook(() => useTrackSearch('bad'), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toEqual([]);
    expect(typeof result.current.retry).toBe('function');
  });
});
