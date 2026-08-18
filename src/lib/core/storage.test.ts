import { describe, expect, it } from 'vitest';
import { createHistoryStore, createViewModeStore, STORAGE_KEYS } from './preferences';
import { createMemoryStore, createTypedStore } from './storage';

describe('typed store', () => {
  it('round-trips a decoded value', () => {
    const store = createTypedStore<number>(createMemoryStore(), 'k', (raw) => (typeof raw === 'number' ? raw : null), 0);
    store.write(42);
    expect(store.read()).toBe(42);
  });

  it('falls back when the key is missing, corrupt, or fails validation', () => {
    const raw = createMemoryStore({ k: 'not json at all' });
    const store = createTypedStore<number>(raw, 'k', (value) => (typeof value === 'number' ? value : null), 7);

    expect(store.read()).toBe(7);

    raw.set('k', JSON.stringify({ nope: true }));
    expect(store.read()).toBe(7);

    raw.remove('k');
    expect(store.read()).toBe(7);
  });
});

describe('history store', () => {
  it('persists under a versioned key and repairs bad data', () => {
    const raw = createMemoryStore();
    const store = createHistoryStore(raw);

    store.write(['adele', 'jazz']);
    expect(raw.get(STORAGE_KEYS.history)).toBe('["adele","jazz"]');
    expect(store.read()).toEqual(['adele', 'jazz']);

    raw.set(STORAGE_KEYS.history, '["a","A","b","c","d","e","f"]');
    expect(store.read()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('view mode store', () => {
  it('remembers a valid mode and rejects anything else', () => {
    const raw = createMemoryStore();
    const store = createViewModeStore(raw);

    expect(store.read()).toBe('list');

    store.write('tile');
    expect(store.read()).toBe('tile');

    raw.set(STORAGE_KEYS.viewMode, '"carousel"');
    expect(store.read()).toBe('list');
  });
});
