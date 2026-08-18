import type { Track, TrackPage } from '@/lib/domain/track';
import type { SearchErrorKind } from '@/lib/domain/errors';

/** The wire contract between our route handler and the browser data layer. */

export interface SearchResponseBody extends TrackPage {
  readonly items: readonly Track[];
  readonly provider: { readonly id: string; readonly label: string; readonly attribution: string };
}

export interface ErrorResponseBody {
  readonly error: { readonly kind: SearchErrorKind; readonly message: string };
}

export const SEARCH_ENDPOINT = '/api/tracks/search';

export const QUERY_PARAM = {
  term: 'q',
  limit: 'limit',
  cursor: 'cursor',
} as const;

/* -------------------------------------------------------------------------- */
/* Runtime guards — a typed `fetch` is a promise, not a proof.                 */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTrack(value: unknown): value is Track {
  if (!isRecord(value)) return false;
  const artwork = value.artwork;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.author === 'string' &&
    typeof value.url === 'string' &&
    isRecord(artwork) &&
    isNullableString(artwork.small) &&
    isNullableString(artwork.large) &&
    isNullableString(value.embedUrl) &&
    Array.isArray(value.tags)
  );
}

export function isSearchResponseBody(value: unknown): value is SearchResponseBody {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.items) || !value.items.every(isTrack)) return false;
  if (!isNullableString(value.nextCursor) || !isNullableString(value.prevCursor)) return false;
  return isRecord(value.provider) && typeof value.provider.label === 'string';
}

export function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return isRecord(value) && isRecord(value.error) && typeof value.error.message === 'string';
}
