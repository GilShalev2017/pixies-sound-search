'use client';

// Generic utility hook, called once from SoundExplorer.tsx:
// `useDebouncedValue(inputValue, 300)`. It sits between the raw search
// box value and the `term` passed to useTrackSearch(), so a request only
// fires 300ms after the user stops typing rather than on every keystroke.
// No dependency on anything search-specific — could debounce any value.
import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value (the search box) so we issue one request
 * per pause in typing rather than one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (Object.is(value, debounced)) return;
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, debounced]);

  return debounced;
}
