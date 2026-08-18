import { describe, expect, it } from 'vitest';
import { buildEmbedUrl, isMixcloudUrl, mapCloudcast, mapSearchResponse, sanitizeCursor } from './mapper';
import type { MixcloudSearchResponse } from './types';

const RAW: MixcloudSearchResponse = {
  data: [
    {
      key: '/spartacus/party-time/',
      name: 'Party Time',
      url: 'https://www.mixcloud.com/spartacus/party-time/',
      audio_length: 3661,
      play_count: 1234,
      created_time: '2016-05-01T10:00:00Z',
      pictures: { medium: 'https://img/med.jpg', '640wx640h': 'https://img/large.jpg' },
      user: { name: 'Spartacus', username: 'spartacus' },
      tags: [{ name: 'house' }, { name: 'disco' }, { name: 'funk' }, { name: 'extra' }],
    },
    // Unusable: no name — must be dropped rather than rendered as "undefined".
    { key: '/broken/' },
  ],
  paging: {
    next: 'https://api.mixcloud.com/search/?q=adele&type=cloudcast&limit=6&offset=6',
    previous: 'https://evil.example.com/steal',
  },
};

describe('mapCloudcast', () => {
  it('maps a cloudcast onto the domain model', () => {
    const track = mapCloudcast(RAW.data![0]);

    expect(track).not.toBeNull();
    expect(track!.id).toBe('/spartacus/party-time/');
    expect(track!.title).toBe('Party Time');
    expect(track!.author).toBe('Spartacus');
    expect(track!.artwork.small).toBe('https://img/med.jpg');
    expect(track!.artwork.large).toBe('https://img/large.jpg');
    expect(track!.durationSec).toBe(3661);
    expect(track!.tags).toEqual(['house', 'disco', 'funk']);
    expect(track!.embedUrl).toContain('feed=%2Fspartacus%2Fparty-time%2F');
  });

  it('returns null for entries we cannot display', () => {
    expect(mapCloudcast({ key: '/x/' })).toBeNull();
    expect(mapCloudcast({ name: 'no key or url' })).toBeNull();
  });

  it('survives a payload with none of the optional fields', () => {
    const track = mapCloudcast({ key: '/a/', name: 'Bare' });

    expect(track).toMatchObject({ author: 'Unknown artist', durationSec: null, playCount: null, tags: [] });
    expect(track!.artwork).toEqual({ small: null, large: null });
  });
});

describe('cursors', () => {
  it('only accepts cursors that point at the Mixcloud API', () => {
    expect(isMixcloudUrl('https://api.mixcloud.com/search/?q=a')).toBe(true);
    expect(isMixcloudUrl('https://evil.example.com/')).toBe(false);
    expect(isMixcloudUrl('http://api.mixcloud.com/search/')).toBe(false);
    expect(isMixcloudUrl('not a url')).toBe(false);
  });

  it('drops a foreign paging URL instead of following it', () => {
    expect(sanitizeCursor('https://evil.example.com/steal')).toBeNull();
    expect(sanitizeCursor(undefined)).toBeNull();
  });
});

describe('mapSearchResponse', () => {
  it('keeps only renderable items and sanitises the paging cursors', () => {
    const page = mapSearchResponse(RAW);

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('https://api.mixcloud.com/search/?q=adele&type=cloudcast&limit=6&offset=6');
    expect(page.prevCursor).toBeNull();
  });

  it('treats a missing data array as an empty page', () => {
    expect(mapSearchResponse({})).toEqual({ items: [], nextCursor: null, prevCursor: null });
  });
});

describe('buildEmbedUrl', () => {
  it('builds a widget URL with autoplay when asked', () => {
    expect(buildEmbedUrl('/a/b/', true)).toContain('autoplay=1');
    expect(buildEmbedUrl('/a/b/', false)).not.toContain('autoplay');
    expect(buildEmbedUrl(undefined, true)).toBeNull();
  });
});
