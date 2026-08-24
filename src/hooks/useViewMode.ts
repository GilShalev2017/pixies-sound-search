'use client';

// Called once from SoundExplorer.tsx: `const { viewMode, setViewMode } =
// useViewMode()`, to toggle between list/tile layout. Thin wrapper around
// usePersistentState.ts - this file supplies the "which store, what
// default" specifics (from src/lib/core/preferences.ts) and gets a typed,
// React-synced value/setter pair back.
import { DEFAULT_VIEW_MODE, createViewModeStore, type ViewMode } from '@/lib/core/preferences';
import { usePersistentState } from './usePersistentState';

/** List/tile preference, remembered across visits. */
export function useViewMode(): { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void } {
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(createViewModeStore, DEFAULT_VIEW_MODE);
  return { viewMode, setViewMode };
}
