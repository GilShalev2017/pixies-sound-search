// Run by `npm test`, not called by app code. Iterates `providers` from
// registry.ts (currently mixcloud + mock) via `describe.each`, so adding
// a third provider to that registry automatically gets it checked here too.
import { describe, expect, it } from 'vitest';
import { SearchError } from '@/lib/domain/errors';
import type { Track } from '@/lib/domain/track';
import { mixcloudProvider } from './mixcloud';
import { mockProvider } from './mock';
import { providers } from './registry';
import type { SoundProvider } from './types';

/**
 * The contract every `SoundProvider` must satisfy.
 *
 * This is the safety net behind "swap the sound API by touching only the data
 * layer": a new adapter is correct when it passes this file, and nothing above
 * the data layer has to be re-checked.
 *
 * Cursor rules are pure, so every registered provider is checked. Search
 * behaviour needs a provider that can answer offline — Mixcloud's mapping is
 * covered separately in `mixcloud/mapper.test.ts`.
 */

const registered: SoundProvider[] = Object.values(providers);
const offlineCapable: SoundProvider[] = [mockProvider];

describe.each(registered.map((provider) => [provider.id, provider] as const))(
  'every provider (%s) declares itself properly',
  (_id, provider) => {
    it('has an id, a label and an attribution string', () => {
      expect(provider.id).toMatch(/^[a-z0-9-]+$/);
      expect(provider.label.length).toBeGreaterThan(0);
      expect(provider.attribution.length).toBeGreaterThan(0);
    });

    it('rejects cursors it did not issue', () => {
      expect(provider.isValidCursor('https://evil.example.com/steal')).toBe(false);
      expect(provider.isValidCursor('')).toBe(false);
      expect(provider.isValidCursor('../../etc/passwd')).toBe(false);
    });
  },
);

it('does not accept another provider’s cursor', () => {
  expect(mixcloudProvider.isValidCursor('mock:6')).toBe(false);
  expect(mockProvider.isValidCursor('https://api.mixcloud.com/search/?q=a')).toBe(false);
});

function assertWellFormed(track: Track): void {
  expect(typeof track.id).toBe('string');
  expect(track.id.length).toBeGreaterThan(0);
  expect(track.title.length).toBeGreaterThan(0);
  expect(track.author.length).toBeGreaterThan(0);
  expect(track.url).toMatch(/^https?:\/\//);
  expect(track.artwork).toHaveProperty('small');
  expect(track.artwork).toHaveProperty('large');
}

describe.each(offlineCapable.map((provider) => [provider.id, provider] as const))(
  'search() of the %s provider honours the contract',
  (_id, provider) => {
    it('never returns more items than the requested limit', async () => {
      const page = await provider.search({ term: 'adele', limit: 4 });
      expect(page.items.length).toBeLessThanOrEqual(4);
      page.items.forEach(assertWellFormed);
    });

    it('offers a forward cursor only while more results exist, and accepts its own', async () => {
      let page = await provider.search({ term: 'adele', limit: 6 });
      let guard = 0;

      while (page.nextCursor && guard < 20) {
        expect(provider.isValidCursor(page.nextCursor)).toBe(true);
        page = await provider.search({ term: 'adele', limit: 6, cursor: page.nextCursor });
        page.items.forEach(assertWellFormed);
        guard += 1;
      }

      expect(guard).toBeGreaterThan(0); // it actually paged
      expect(page.nextCursor).toBeNull(); // and it stopped offering a cursor
    });

    it('reports an empty result set rather than inventing one', async () => {
      const page = await provider.search({ term: 'zzz-nothing', limit: 6 });
      expect(page.items).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });

    it('fails with a SearchError the UI can classify', async () => {
      await expect(provider.search({ term: 'boom', limit: 6 })).rejects.toBeInstanceOf(SearchError);
    });

    it('rejects with an abort error when the caller cancels', async () => {
      const controller = new AbortController();
      const pending = provider.search({ term: 'adele', limit: 6, signal: controller.signal });
      controller.abort();

      const error = await pending.catch((e: unknown) => e);
      expect(SearchError.isAbort(error)).toBe(true);
    });
  },
);
