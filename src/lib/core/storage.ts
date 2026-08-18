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
  /** Storage key, so a reactive wrapper can watch cross-tab `storage` events. */
  readonly key: string;
}

/** Wraps a raw store with JSON (de)serialisation and a validating decoder. */
export function createTypedStore<T>(
  store: KeyValueStore,
  key: string,
  decode: (raw: unknown) => T | null,
  fallback: T,
): TypedStore<T> {
  return {
    key,
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

/* -------------------------------------------------------------------------- */
/* React-facing wrapper                                                        */
/* -------------------------------------------------------------------------- */

export interface ReactiveStore<T> {
  subscribe(listener: () => void): () => void;
  /** Referentially stable between writes, as `useSyncExternalStore` requires. */
  getSnapshot(): T;
  set(value: T): void;
}

/**
 * Turns a `TypedStore` into an external store React can subscribe to.
 * The cached snapshot keeps identity stable, and `storage` events keep two open
 * tabs in agreement about the recent searches.
 */
export function createReactiveStore<T>(typed: TypedStore<T>): ReactiveStore<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== typed.key) return;
        cache = null;
        listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot() {
      cache ??= { value: typed.read() };
      return cache.value;
    },
    set(value) {
      cache = { value };
      typed.write(value);
      emit();
    },
  };
}
