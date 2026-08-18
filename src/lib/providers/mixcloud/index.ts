import { SearchError } from '@/lib/domain/errors';
import type { TrackPage } from '@/lib/domain/track';
import type { ProviderSearchOptions, SoundProvider } from '../types';
import { MIXCLOUD_API_ORIGIN, isMixcloudUrl, mapSearchResponse } from './mapper';
import type { MixcloudSearchResponse } from './types';

function buildSearchUrl({ term, limit, cursor }: ProviderSearchOptions): string {
  // A cursor already encodes the query and the limit — trust it verbatim.
  if (cursor) return cursor;

  const params = new URLSearchParams({
    q: term,
    type: 'cloudcast',
    limit: String(limit),
  });
  return `${MIXCLOUD_API_ORIGIN}/search/?${params.toString()}`;
}

export const mixcloudProvider: SoundProvider = {
  id: 'mixcloud',
  label: 'Mixcloud',
  attribution: 'Audio, artwork and playback are provided by Mixcloud.',

  isValidCursor: isMixcloudUrl,

  async search(options: ProviderSearchOptions): Promise<TrackPage> {
    const url = buildSearchUrl(options);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: options.signal,
        headers: { accept: 'application/json' },
        // Results are cached at our own edge instead (see the route handler),
        // so we always ask the provider for the truth.
        cache: 'no-store',
      });
    } catch (error) {
      if (SearchError.isAbort(error)) throw new SearchError('aborted', 'Request superseded');
      throw new SearchError('network', 'Could not reach Mixcloud');
    }

    if (!response.ok) {
      throw new SearchError('upstream', `Mixcloud responded with ${response.status}`, response.status);
    }

    let payload: MixcloudSearchResponse;
    try {
      payload = (await response.json()) as MixcloudSearchResponse;
    } catch {
      throw new SearchError('invalid', 'Mixcloud returned a malformed payload');
    }

    if (!payload || !Array.isArray(payload.data)) {
      throw new SearchError('invalid', 'Mixcloud returned a payload without a data array');
    }

    return mapSearchResponse(payload);
  },
};
