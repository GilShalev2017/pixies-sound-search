// The second `SoundProvider` (see ../types.ts) - selected by registry.ts's
// getActiveProvider() only when SOUND_PROVIDER=mock. Same interface as
// ../mixcloud/index.ts, called the same way from GET() in route.ts, but
// every "result" is fabricated below from a deterministic hash instead
// of a real fetch() - useful when there's no network, or to reliably
// hit specific UI states (see the `term.includes('boom'/'zzz')` hooks).
import { SearchError } from '@/lib/domain/errors';
import type { Track, TrackPage } from '@/lib/domain/track';
import type { ProviderSearchOptions, SoundProvider } from '../types';

/**
 * An offline provider used by tests, by `npm run dev:mock`, and as a live demo
 * when the machine running the app cannot reach Mixcloud.
 *
 * It exists mostly to prove the point of the port/adapter split: the UI, the
 * hooks and the route handler are identical no matter which provider is active.
 */

const TOTAL_RESULTS = 23;
const CURSOR_PREFIX = 'mock:';

const ARTISTS = [
  'Nightform',
  'Lunar Tide',
  'Kessler & Vane',
  'Static Bloom',
  'The Paper Hours',
  'Odessa Line',
];

const FLAVOURS = [
  'Late Night Session',
  'Rooftop Mix',
  'Analog Dreams',
  'Deep Cuts',
  'Sunrise Set',
  'B-Sides & Rarities',
  'Live at the Warehouse',
  'Slow Motion',
];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function makeTrack(term: string, index: number): Track {
  const seed = hash(`${term}:${index}`);
  const artwork = `/mock/art-${(seed % 6) + 1}.svg`;
  return {
    id: `${CURSOR_PREFIX}${term}:${index}`,
    title: `${term.replace(/\b\w/g, (c) => c.toUpperCase())} — ${FLAVOURS[seed % FLAVOURS.length]}`,
    author: ARTISTS[seed % ARTISTS.length],
    url: 'https://www.mixcloud.com/',
    artwork: { small: artwork, large: artwork },
    durationSec: 1800 + (seed % 5400),
    playCount: 120 + (seed % 90000),
    publishedAt: new Date(Date.UTC(2024, seed % 12, (seed % 27) + 1)).toISOString(),
    tags: ['demo', 'mock', term.toLowerCase()].slice(0, 3),
    embedUrl: '/mock/player.html',
  };
}

function parseCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const offset = Number.parseInt(cursor.slice(CURSOR_PREFIX.length), 10);
  return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new SearchError('aborted', 'Request superseded'));
    });
  });
}

export const mockProvider: SoundProvider = {
  id: 'mock',
  label: 'Mock (offline)',
  attribution: 'Offline demo data — no external service is contacted.',

  isValidCursor: (cursor) => cursor.startsWith(CURSOR_PREFIX),

  async search({ term, limit, cursor, signal }: ProviderSearchOptions): Promise<TrackPage> {
    await delay(320, signal);

    // Deterministic hooks so every UI state can be demoed without the network.
    if (term.toLowerCase().includes('boom')) {
      throw new SearchError('upstream', 'Mock provider failure (search for anything else to recover)', 503);
    }
    const total = term.toLowerCase().includes('zzz') ? 0 : TOTAL_RESULTS;

    const offset = parseCursor(cursor);
    const items = Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) =>
      makeTrack(term, offset + i),
    );

    return {
      items,
      nextCursor: offset + limit < total ? `${CURSOR_PREFIX}${offset + limit}` : null,
      prevCursor: offset > 0 ? `${CURSOR_PREFIX}${Math.max(0, offset - limit)}` : null,
    };
  },
};
