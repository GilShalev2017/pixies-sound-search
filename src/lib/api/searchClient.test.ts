// Unit tests for searchClient.ts's searchTracks() - the client-side leg
// of the request path. Stubs `fetchImpl` directly (see that function's
// injectable-fetch param) rather than mocking the global fetch, so no
// real network or server is involved.
import { describe, expect, it, vi } from 'vitest';
import { SearchError } from '@/lib/domain/errors';
import { searchTracks } from './searchClient';

const page = {
  items: [
    {
      id: '/a/',
      title: 'A',
      author: 'B',
      url: 'https://example.com/a',
      artwork: { small: null, large: null },
      durationSec: null,
      playCount: null,
      publishedAt: null,
      tags: [],
      embedUrl: null,
    },
  ],
  nextCursor: 'cursor-2',
  prevCursor: null,
  provider: { id: 'mock', label: 'Mock', attribution: 'demo' },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('searchTracks', () => {
  it('sends the term, the page size and the cursor to our own endpoint', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(page));

    await searchTracks({ term: 'adele', limit: 6, cursor: 'cursor-2', fetchImpl: fetchImpl as unknown as typeof fetch });

    const url = new URL(String(fetchImpl.mock.calls[0][0]), 'http://localhost');
    expect(url.pathname).toBe('/api/tracks/search');
    expect(url.searchParams.get('q')).toBe('adele');
    expect(url.searchParams.get('limit')).toBe('6');
    expect(url.searchParams.get('cursor')).toBe('cursor-2');
  });

  it('returns the parsed page', async () => {
    const result = await searchTracks({
      term: 'adele',
      limit: 6,
      fetchImpl: (async () => jsonResponse(page)) as unknown as typeof fetch,
    });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe('cursor-2');
  });

  it('surfaces the provider error kind from a failed response', async () => {
    const fetchImpl = (async () =>
      jsonResponse({ error: { kind: 'upstream', message: 'Mixcloud responded with 429' } }, 429)) as unknown as typeof fetch;

    await expect(searchTracks({ term: 'a', limit: 6, fetchImpl })).rejects.toMatchObject({
      kind: 'upstream',
      status: 429,
    });
  });

  it('rejects a payload that does not match the contract', async () => {
    const fetchImpl = (async () => jsonResponse({ items: [{ nope: true }] })) as unknown as typeof fetch;

    await expect(searchTracks({ term: 'a', limit: 6, fetchImpl })).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('reports an aborted request as `aborted`, never as a failure the user sees', async () => {
    const controller = new AbortController();
    const fetchImpl = (async () => {
      controller.abort();
      throw new DOMException('The user aborted a request.', 'AbortError');
    }) as unknown as typeof fetch;

    const error = await searchTracks({ term: 'a', limit: 6, signal: controller.signal, fetchImpl }).catch((e) => e);

    expect(error).toBeInstanceOf(SearchError);
    expect(SearchError.isAbort(error)).toBe(true);
  });

  it('classifies a transport failure as a network error', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;

    await expect(searchTracks({ term: 'a', limit: 6, fetchImpl })).rejects.toMatchObject({ kind: 'network' });
  });
});
