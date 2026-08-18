import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/core/preferences';
import { useSearchHistory } from './useSearchHistory';
import { useViewMode } from './useViewMode';

beforeEach(() => window.localStorage.clear());

describe('useSearchHistory', () => {
  it('starts empty and survives a remount (the "subsequent visits" requirement)', () => {
    const first = renderHook(() => useSearchHistory());
    expect(first.result.current.entries).toEqual([]);

    act(() => first.result.current.remember('adele'));
    act(() => first.result.current.remember('jazz'));
    first.unmount();

    const second = renderHook(() => useSearchHistory());
    expect(second.result.current.entries).toEqual(['jazz', 'adele']);
  });

  it('does not create a duplicate entry when a term is searched again', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => result.current.remember('adele'));
    act(() => result.current.remember('jazz'));
    act(() => result.current.remember('ADELE'));

    // One entry, moved back to the top, keeping the spelling the user just used.
    expect(result.current.entries).toEqual(['ADELE', 'jazz']);
  });

  it('keeps only the last five terms', () => {
    const { result } = renderHook(() => useSearchHistory());

    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((term) => act(() => result.current.remember(term)));

    expect(result.current.entries).toEqual(['f', 'e', 'd', 'c', 'b']);
  });

  it('can forget one term and clear them all', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => result.current.remember('adele'));
    act(() => result.current.remember('jazz'));
    act(() => result.current.forget('adele'));
    expect(result.current.entries).toEqual(['jazz']);

    act(() => result.current.clear());
    expect(result.current.entries).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEYS.history)).toBe('[]');
  });

  it('ignores corrupt persisted data instead of crashing', () => {
    window.localStorage.setItem(STORAGE_KEYS.history, '{oops');
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.entries).toEqual([]);
  });
});

describe('useViewMode', () => {
  it('defaults to list and remembers the choice for the next visit', () => {
    const first = renderHook(() => useViewMode());
    expect(first.result.current.viewMode).toBe('list');

    act(() => first.result.current.setViewMode('tile'));
    first.unmount();

    const second = renderHook(() => useViewMode());
    expect(second.result.current.viewMode).toBe('tile');
  });
});
