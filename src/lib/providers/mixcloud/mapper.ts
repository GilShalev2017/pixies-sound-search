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

/**
 * In plain terms: Mixcloud doesn't always send every size of a track's cover
 * picture — sometimes the "medium" one is missing, sometimes the "large" one
 * is. This function is given a wish-list of sizes in order of preference,
 * and tries them one by one until it finds one that Mixcloud actually sent.
 * If none of the sizes on the list are available, it gives back nothing
 * (instead of crashing or making one up).
 */
function pick(pictures: MixcloudPictures | undefined, keys: readonly (keyof MixcloudPictures)[]): string | null {
  if (!pictures) return null;
  for (const key of keys) {
    const value = pictures[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

/**
 * In plain terms: to let someone press play right on our page (instead of
 * being sent away to Mixcloud's website), we need to build a special web
 * address that loads Mixcloud's own small music-player widget. This
 * function builds that address from whatever identifies the track — its
 * full web link if we have one, otherwise its short internal code — and
 * tacks on a few display options, like "use the compact player" and,
 * optionally, "start playing immediately". If we have neither a link nor a
 * code for the track, there is nothing to build a player for, so it gives
 * back nothing.
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

/**
 * In plain terms: Mixcloud sends back information about one track in its
 * own format, with fields that are sometimes missing or oddly shaped. This
 * function takes one such track and reshapes it into the simple, reliable
 * format the rest of our app expects: a title, an artist name, a cover
 * picture, how long it runs, how many times it's been played, when it was
 * published, up to three tags, and a link to a playable widget (built by
 * `buildEmbedUrl` above). If the track is missing the two things we
 * absolutely need — something to identify it by, and a title — it's
 * treated as unusable and this returns nothing, so a broken entry never
 * ends up shown to the user as a nameless, blank result.
 */
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

/**
 * In plain terms: when we ask Mixcloud for a page of search results, it
 * often includes a special link for fetching the *next* page. That link
 * gets sent back to our browser and, later, right back to our own server —
 * so before trusting it, we double-check that it really does point at
 * Mixcloud, using `isMixcloudUrl` below, and not somewhere else pretending
 * to be Mixcloud. If it doesn't check out, or if there simply is no next
 * page, this returns nothing rather than a link.
 */
export function sanitizeCursor(cursor: string | undefined): string | null {
  if (!cursor) return null;
  return isMixcloudUrl(cursor) ? cursor : null;
}

/**
 * In plain terms: this checks whether a given web address genuinely
 * belongs to Mixcloud, rather than trusting it just because it looks like
 * a URL. It's also reused elsewhere in the app as the check for "is this a
 * cursor I recognise" — since a Mixcloud paging link and a Mixcloud web
 * address are the same kind of thing. If the text isn't even a valid web
 * address at all, it's treated as untrustworthy too, not as an error.
 */
export function isMixcloudUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === MIXCLOUD_API_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * In plain terms: this is the "do everything" function for one page of
 * search results. It takes the whole reply Mixcloud sent back — the list
 * of tracks, plus the links to the next and previous pages — and turns it
 * into the shape our app understands. Each track is reshaped one at a time
 * by `mapCloudcast` above, and any track that came back too broken to use
 * is quietly left out rather than shown as an empty result. The next/previous
 * page links are double-checked by `sanitizeCursor` above before being
 * trusted.
 */
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
