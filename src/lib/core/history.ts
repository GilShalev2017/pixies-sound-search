// `normalizeTerm` is shared widely (SoundExplorer.tsx, the mixcloud
// provider isn't involved - this is UI-side only). `addSearchTerm` and
// `removeSearchTerm` are called only from useSearchHistory.ts; `parseHistory`
// is called only from preferences.ts's `readHistory`, to validate whatever
// was persisted. Kept framework-free on purpose: see history.test.ts.
/**
 * Recent-searches logic. Pure functions, zero framework — this is the kind of
 * rule that deserves tests rather than a click-through.
 */

export const MAX_HISTORY_ENTRIES = 5;

/** Collapses whitespace so `"  lo-fi   beats "` and `"lo-fi beats"` are one term. */
export function normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

/** Terms are compared case-insensitively: "Adele" must not sit next to "adele". */
export function isSameTerm(a: string, b: string): boolean {
  return normalizeTerm(a).toLocaleLowerCase() === normalizeTerm(b).toLocaleLowerCase();
}

/**
 * Adds a term to the history, most recent first.
 * Re-searching an existing term moves it to the top instead of duplicating it.
 */
export function addSearchTerm(
  history: readonly string[],
  term: string,
  max: number = MAX_HISTORY_ENTRIES,
): string[] {
  const normalized = normalizeTerm(term);
  if (!normalized) return [...history];

  const withoutDuplicate = history.filter((entry) => !isSameTerm(entry, normalized));
  return [normalized, ...withoutDuplicate].slice(0, max);
}

export function removeSearchTerm(history: readonly string[], term: string): string[] {
  return history.filter((entry) => !isSameTerm(entry, term));
}

/** Defensive parse: persisted data is user-editable and may be from an older build. */
export function parseHistory(value: unknown, max: number = MAX_HISTORY_ENTRIES): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(normalizeTerm)
    .filter(Boolean);

  return cleaned.reduce<string[]>((acc, entry) => {
    if (acc.some((existing) => isSameTerm(existing, entry))) return acc;
    return acc.length < max ? [...acc, entry] : acc;
  }, []);
}
