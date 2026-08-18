'use client';

import { DEFAULT_VIEW_MODE, createViewModeStore, type ViewMode } from '@/lib/core/preferences';
import { usePersistentState } from './usePersistentState';

/** List/tile preference, remembered across visits. */
export function useViewMode(): { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void } {
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(createViewModeStore, DEFAULT_VIEW_MODE);
  return { viewMode, setViewMode };
}
