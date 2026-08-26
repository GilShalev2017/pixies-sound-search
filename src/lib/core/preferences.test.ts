// Unit tests for preferences.ts's read/write functions, against the real
// (jsdom) localStorage — cleared before each test so runs don't leak into
// each other.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEW_MODE,
  STORAGE_KEYS,
  readHistory,
  readViewMode,
  writeHistory,
  writeViewMode,
} from './preferences';

beforeEach(() => window.localStorage.clear());

describe('view mode', () => {
  it('defaults to "list" when nothing is persisted', () => {
    expect(readViewMode()).toBe(DEFAULT_VIEW_MODE);
  });

  it('round-trips a written mode', () => {
    writeViewMode('tile');
    expect(readViewMode()).toBe('tile');
  });

  it('falls back to the default for missing, corrupt or invalid data', () => {
    window.localStorage.setItem(STORAGE_KEYS.viewMode, 'not json at all');
    expect(readViewMode()).toBe(DEFAULT_VIEW_MODE);

    window.localStorage.setItem(STORAGE_KEYS.viewMode, JSON.stringify('carousel'));
    expect(readViewMode()).toBe(DEFAULT_VIEW_MODE);
  });
});

describe('history', () => {
  it('defaults to an empty list when nothing is persisted', () => {
    expect(readHistory()).toEqual([]);
  });

  it('round-trips written entries under the versioned key', () => {
    writeHistory(['adele', 'jazz']);
    expect(window.localStorage.getItem(STORAGE_KEYS.history)).toBe('["adele","jazz"]');
    expect(readHistory()).toEqual(['adele', 'jazz']);
  });

  it('repairs bad data instead of throwing: dedupes, caps at five, drops junk', () => {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(['a', 'A', 'b', 'c', 'd', 'e', 'f']));
    expect(readHistory()).toEqual(['a', 'b', 'c', 'd', 'e']);

    window.localStorage.setItem(STORAGE_KEYS.history, 'not json at all');
    expect(readHistory()).toEqual([]);

    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify({ nope: true }));
    expect(readHistory()).toEqual([]);
  });
});
