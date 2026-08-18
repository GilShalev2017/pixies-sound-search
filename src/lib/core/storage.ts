/**
 * Storage port + adapters.
 *
 * Everything above this file talks to `KeyValueStore`, so persistence can move
 * from `localStorage` to a cookie, IndexedDB or a user account without touching
 * a hook or a component. Tests use the in-memory adapter.
 */

export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

/** Never throws: Safari private mode and disabled storage must not break the app. */
export function createBrowserStore(): KeyValueStore {
  const available = (): Storage | null => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  };

  return {
    get(key) {
      try {
        return available()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        available()?.setItem(key, value);
      } catch {
        /* quota or privacy mode — the app keeps working, it just forgets */
      }
    },
    remove(key) {
      try {
        available()?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export interface TypedStore<T> {
  read(): T;
  write(value: T): void;
}

/** Wraps a raw store with JSON (de)serialisation and a validating decoder. */
export function createTypedStore<T>(
  store: KeyValueStore,
  key: string,
  decode: (raw: unknown) => T | null,
  fallback: T,
): TypedStore<T> {
  return {
    read() {
      const raw = store.get(key);
      if (raw === null) return fallback;
      try {
        return decode(JSON.parse(raw) as unknown) ?? fallback;
      } catch {
        return fallback;
      }
    },
    write(value) {
      store.set(key, JSON.stringify(value));
    },
  };
}
