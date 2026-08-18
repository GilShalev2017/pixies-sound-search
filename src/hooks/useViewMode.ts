'use client';

import { useCallback } from 'react';
import { DEFAULT_VIEW_MODE, createViewModeStore, type ViewMode } from '@/lib/core/preferences';
import { usePersistentState } from './usePersistentState';

/** List/tile preference, remembered across visits. */
export function useViewMode(): { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void; hydrated: boolean } {
  const [viewMode, setValue, hydrated] = usePersistentState<ViewMode>(() => createViewModeStore(), DEFAULT_VIEW_MODE);
  const setViewMode = useCallback((mode: ViewMode) => setValue(mode), [setValue]);
  return { viewMode, setViewMode, hydrated };
}
