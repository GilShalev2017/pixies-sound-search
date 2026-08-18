import { parseHistory } from './history';
import { createBrowserStore, createTypedStore, type KeyValueStore, type TypedStore } from './storage';

export const STORAGE_KEYS = {
  history: 'pixies:recent-searches:v1',
  viewMode: 'pixies:view-mode:v1',
} as const;

export const VIEW_MODES = ['list', 'tile'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];
export const DEFAULT_VIEW_MODE: ViewMode = 'list';

export function parseViewMode(raw: unknown): ViewMode | null {
  return typeof raw === 'string' && (VIEW_MODES as readonly string[]).includes(raw) ? (raw as ViewMode) : null;
}

export function createHistoryStore(store: KeyValueStore = createBrowserStore()): TypedStore<string[]> {
  return createTypedStore<string[]>(store, STORAGE_KEYS.history, (raw) => parseHistory(raw), []);
}

export function createViewModeStore(store: KeyValueStore = createBrowserStore()): TypedStore<ViewMode> {
  return createTypedStore<ViewMode>(store, STORAGE_KEYS.viewMode, parseViewMode, DEFAULT_VIEW_MODE);
}
