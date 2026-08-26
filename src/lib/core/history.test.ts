// Unit tests for the pure functions in history.ts - dedup, ordering,
// case-insensitivity, the 5-entry cap, and parseHistory's defensive
// parsing of whatever localStorage happens to contain.
import { describe, expect, it } from 'vitest';
import { MAX_HISTORY_ENTRIES, addSearchTerm, normalizeTerm, parseHistory, removeSearchTerm } from './history';

describe('normalizeTerm', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTerm('  lo-fi   beats ')).toBe('lo-fi beats');
  });
});

describe('addSearchTerm', () => {
  it('adds the newest term first', () => {
    expect(addSearchTerm(['jazz'], 'adele')).toEqual(['adele', 'jazz']);
  });

  it('ignores blank terms', () => {
    expect(addSearchTerm(['jazz'], '   ')).toEqual(['jazz']);
  });

  it('moves an existing term to the top instead of duplicating it', () => {
    expect(addSearchTerm(['jazz', 'adele', 'house'], 'adele')).toEqual(['adele', 'jazz', 'house']);
  });

  it('treats terms case- and whitespace-insensitively', () => {
    expect(addSearchTerm(['Adele'], '  adele ')).toEqual(['adele']);
  });

  it('keeps at most five entries, dropping the oldest', () => {
    const history = ['e', 'd', 'c', 'b', 'a'];
    const result = addSearchTerm(history, 'f');

    expect(result).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(result[0]).toBe('f');
    expect(result).not.toContain('a');
  });

  it('does not mutate the input', () => {
    const history = ['jazz'];
    addSearchTerm(history, 'adele');
    expect(history).toEqual(['jazz']);
  });
});

describe('removeSearchTerm', () => {
  it('removes a term regardless of casing', () => {
    expect(removeSearchTerm(['Adele', 'jazz'], 'adele')).toEqual(['jazz']);
  });
});

describe('parseHistory', () => {
  it('rejects anything that is not an array of strings', () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory({ terms: ['a'] })).toEqual([]);
    expect(parseHistory(['a', 42, null])).toEqual(['a']);
  });

  it('repairs persisted data that contains duplicates or is over the cap', () => {
    expect(parseHistory(['a', 'A', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
