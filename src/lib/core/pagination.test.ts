// Unit tests for the cursor-paging state machine in pagination.ts, the
// piece useTrackSearch.ts relies on to walk forward/back without
// re-deriving cursors from an offset.
import { describe, expect, it } from 'vitest';
import {
  INITIAL_CURSOR_STATE,
  canGoNext,
  canGoPrev,
  currentCursor,
  goNext,
  goPrev,
  pageNumber,
  resetCursors,
} from './pagination';

describe('cursor pagination', () => {
  it('starts on page one with no cursor and no way back', () => {
    expect(currentCursor(INITIAL_CURSOR_STATE)).toBeNull();
    expect(pageNumber(INITIAL_CURSOR_STATE)).toBe(1);
    expect(canGoPrev(INITIAL_CURSOR_STATE)).toBe(false);
  });

  it('cannot move forward without a provider cursor', () => {
    expect(canGoNext(INITIAL_CURSOR_STATE, null)).toBe(false);
    expect(goNext(INITIAL_CURSOR_STATE, null)).toBe(INITIAL_CURSOR_STATE);
  });

  it('walks forward using the provider cursor', () => {
    const page2 = goNext(INITIAL_CURSOR_STATE, 'cursor-2');

    expect(currentCursor(page2)).toBe('cursor-2');
    expect(pageNumber(page2)).toBe(2);
    expect(canGoPrev(page2)).toBe(true);
  });

  it('walks back to the exact cursor of the previous page', () => {
    const page3 = goNext(goNext(INITIAL_CURSOR_STATE, 'cursor-2'), 'cursor-3');
    const back = goPrev(page3);

    expect(currentCursor(back)).toBe('cursor-2');
    expect(pageNumber(back)).toBe(2);
  });

  it('reuses remembered cursors when moving forward again, without asking for a new one', () => {
    const page3 = goNext(goNext(INITIAL_CURSOR_STATE, 'cursor-2'), 'cursor-3');
    const forwardAgain = goNext(goPrev(page3), null);

    expect(currentCursor(forwardAgain)).toBe('cursor-3');
    expect(canGoNext(goPrev(page3), null)).toBe(true);
  });

  it('drops stale forward history when the provider returns a different cursor', () => {
    const page3 = goNext(goNext(INITIAL_CURSOR_STATE, 'cursor-2'), 'cursor-3');
    const diverged = goNext(goPrev(goPrev(page3)), 'cursor-2b');

    expect(diverged.stack).toEqual([null, 'cursor-2b']);
    expect(pageNumber(diverged)).toBe(2);
  });

  it('never walks back past the first page', () => {
    expect(goPrev(INITIAL_CURSOR_STATE)).toBe(INITIAL_CURSOR_STATE);
  });

  it('resets to the first page', () => {
    expect(resetCursors()).toEqual(INITIAL_CURSOR_STATE);
  });
});
