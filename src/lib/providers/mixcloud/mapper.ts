// Pure translation layer, used only by ./index.ts (the mixcloud provider).
// Every export here takes Mixcloud's raw wire shapes (./types.ts) and
// returns this project's own domain shapes (@/lib/domain/track) - no
// network calls, no React, easy to unit-test in isolation (see
// mapper.test.ts). `isMixcloudUrl` is also re-exported by index.ts and
// used as `isValidCursor`, since a Mixcloud paging cursor is just a URL.
import type { Track, TrackPage } from '@/lib/domain/track';
import type { MixcloudCloudcast, MixcloudPictures, MixcloudSearchResponse } from './types';

export const MIXCLOUD_API_ORIGIN = 'https://api.mixcloud.com';
// The widget host documented in the exam brief; it accepts either the cloudcast
// key (`/user/show/`) or its full URL as the `feed` parameter.
const WIDGET_BASE = 'https://www.mixcloud.com/widget/iframe/';

/** Pick the best available picture without assuming any single key exists. */
function pick(pictures: MixcloudPictures | undefined, keys: readonly (keyof MixcloudPictures)[]): string | null {
  if (!pictures) return null;
  for (const key of keys) {
    const value = pictures[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

/**
 * Mixcloud embeds are driven by the cloudcast's canonical URL, falling back to
 * its key (e.g. `/spartacus/party-time/`) when the payload omits the URL.
 * `light=1` gives the compact player that sits nicely under the artwork.
 */
export function buildEmbedUrl(key: string | undefined, url: string | undefined, autoplay: boolean): string | null {
  const feed = url ?? key;
  if (!feed) return null;
  const params = new URLSearchParams({
    hide_cover: '1',
    light: '1',
    feed,
  });
  if (autoplay) params.set('autoplay', '1');
  return `${WIDGET_BASE}?${params.toString()}`;
}

export function mapCloudcast(raw: MixcloudCloudcast): Track | null {
  const id = raw.key ?? raw.url ?? null;
  if (!id || !raw.name) return null;

  return {
    id,
    title: raw.name,
    author: raw.user?.name ?? raw.user?.username ?? 'Unknown artist',
    url: raw.url ?? `https://www.mixcloud.com${raw.key ?? ''}`,
    artwork: {
      small: pick(raw.pictures, ['medium', 'thumbnail', 'small', 'large']),
      large: pick(raw.pictures, ['640wx640h', 'extra_large', 'large', '320wx320h', 'medium']),
    },
    durationSec: typeof raw.audio_length === 'number' ? raw.audio_length : null,
    playCount: typeof raw.play_count === 'number' ? raw.play_count : null,
    publishedAt: raw.created_time ?? null,
    tags: (raw.tags ?? [])
      .map((tag) => tag.name)
      .filter((name): name is string => typeof name === 'string')
      .slice(0, 3),
    embedUrl: buildEmbedUrl(raw.key, raw.url, true),
  };
}

/** Cursors are the opaque paging URLs Mixcloud hands back; we only keep our own origin. */
export function sanitizeCursor(cursor: string | undefined): string | null {
  if (!cursor) return null;
  return isMixcloudUrl(cursor) ? cursor : null;
}

export function isMixcloudUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === MIXCLOUD_API_ORIGIN;
  } catch {
    return false;
  }
}

export function mapSearchResponse(raw: MixcloudSearchResponse): TrackPage {
  const items = (raw.data ?? [])
    .map(mapCloudcast)
    .filter((track): track is Track => track !== null);

  return {
    items,
    nextCursor: sanitizeCursor(raw.paging?.next),
    prevCursor: sanitizeCursor(raw.paging?.previous),
  };
}
