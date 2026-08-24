'use client';

// Called once from SoundExplorer.tsx: `useSearchShortcuts(inputRef,
// clearSearch)`. Pure side-effect hook - it returns nothing, just attaches
// a window keydown listener for the app's two keyboard shortcuts and
// cleans it up on unmount. Independent of the other hooks in this folder.
import { useEffect, type RefObject } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * `/` focuses the search box from anywhere, `Escape` clears it while focused.
 * Both are ignored when the user is already typing somewhere else.
 */
export function useSearchShortcuts(inputRef: RefObject<HTMLInputElement | null>, onClear: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      if (event.key === 'Escape' && event.target === inputRef.current) {
        onClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inputRef, onClear]);
}
