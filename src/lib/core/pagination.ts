/**
 * Cursor pagination as a pure state machine.
 *
 * The provider only tells us how to move *forward*, so we remember the cursor of
 * every page we have visited. Going back is then exact (no offset arithmetic),
 * and "can I go back?" is answerable without another request.
 */

export interface CursorState {
  /** Cursor of each visited page; the first page is always `null`. */
  readonly stack: readonly (string | null)[];
  readonly index: number;
}

export const INITIAL_CURSOR_STATE: CursorState = { stack: [null], index: 0 };

export function currentCursor(state: CursorState): string | null {
  return state.stack[state.index] ?? null;
}

export function pageNumber(state: CursorState): number {
  return state.index + 1;
}

export function canGoPrev(state: CursorState): boolean {
  return state.index > 0;
}

export function canGoNext(state: CursorState, nextCursor: string | null | undefined): boolean {
  // Either the provider gave us a forward cursor, or we have already been further.
  return Boolean(nextCursor) || state.index < state.stack.length - 1;
}

export function goNext(state: CursorState, nextCursor: string | null | undefined): CursorState {
  const remembered = state.index + 1 < state.stack.length ? state.stack[state.index + 1] : undefined;

  // Already been here and the provider agrees: just step forward.
  if (remembered !== undefined && (!nextCursor || nextCursor === remembered)) {
    return { ...state, index: state.index + 1 };
  }

  if (!nextCursor) return state;

  // Either a brand new page, or the provider handed back a *different* forward
  // cursor — trust the fresh one and drop the stale forward history.
  return {
    stack: [...state.stack.slice(0, state.index + 1), nextCursor],
    index: state.index + 1,
  };
}

export function goPrev(state: CursorState): CursorState {
  if (!canGoPrev(state)) return state;
  return { ...state, index: state.index - 1 };
}

export function resetCursors(): CursorState {
  return INITIAL_CURSOR_STATE;
}
