// Client-side entry point of the request path. Called by the
// `useTrackSearch` hook (src/hooks/useTrackSearch.ts) - a React component
// never calls `fetch` directly, it goes through this function so the
// fetch/parse/error-mapping logic is written once and unit-testable.
//
// searchTracks() -> GET /api/tracks/search (src/app/api/tracks/search/route.ts)
// -> the active provider's search() -> back here as SearchResponseBody.
import { SearchError } from '@/lib/domain/errors';
import type { SearchQuery } from '@/lib/domain/track';
import {
  QUERY_PARAM,
  SEARCH_ENDPOINT,
  type SearchResponseBody,
  isErrorResponseBody,
  isSearchResponseBody,
} from './contract';

export interface SearchTracksOptions extends SearchQuery {
  readonly signal?: AbortSignal;
  /** Injectable for tests; defaults to the platform `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * The browser-side half of the data layer.
 *
 * It talks to *our* endpoint, never to a third party: that keeps CORS, provider
 * credentials and payload mapping on the server, and means swapping providers is
 * an environment variable rather than a client deploy.
 */
export async function searchTracks({
  term,
  limit,
  cursor,
  signal,
  fetchImpl = fetch,
}: SearchTracksOptions): Promise<SearchResponseBody> {
  const params = new URLSearchParams({ [QUERY_PARAM.term]: term, [QUERY_PARAM.limit]: String(limit) });
  if (cursor) params.set(QUERY_PARAM.cursor, cursor);

  let response: Response;
  try {
    response = await fetchImpl(`${SEARCH_ENDPOINT}?${params.toString()}`, {
      signal,
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    if (SearchError.isAbort(error)) throw new SearchError('aborted', 'Request superseded');
    throw new SearchError('network', 'The search request failed to leave the browser');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const kind = isErrorResponseBody(payload) ? payload.error.kind : 'upstream';
    const message = isErrorResponseBody(payload) ? payload.error.message : `Request failed (${response.status})`;
    throw new SearchError(kind === 'aborted' ? 'upstream' : kind, message, response.status);
  }

  if (!isSearchResponseBody(payload)) {
    throw new SearchError('invalid', 'The search endpoint returned an unexpected payload');
  }

  return payload;
}
