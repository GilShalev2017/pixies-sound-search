// Where the two persisted-state hooks get their read/write functions from:
// useSearchHistory.ts calls readHistory/writeHistory, useViewMode.ts calls
// readViewMode/writeViewMode. Each pair does its own localStorage access
// (safe against Safari private mode / a full quota), JSON (de)serialisation
// and validation, so a corrupt or outdated persisted value falls back to a
// sane default instead of crashing the app.
import { parseHistory } from './history';

export const STORAGE_KEYS = {
  history: 'pixies:recent-searches:v1',
  viewMode: 'pixies:view-mode:v1',
} as const;

export const VIEW_MODES = ['list', 'tile'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];
export const DEFAULT_VIEW_MODE: ViewMode = 'list';

function parseViewMode(raw: unknown): ViewMode | null {
  return typeof raw === 'string' && (VIEW_MODES as readonly string[]).includes(raw) ? (raw as ViewMode) : null;
}

/** Never throws: Safari private mode and disabled storage must not break the app. */
function readRaw(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota or privacy mode — the app keeps working, it just forgets */
  }
}

export function readViewMode(): ViewMode {
  const raw = readRaw(STORAGE_KEYS.viewMode);
  if (raw === null) return DEFAULT_VIEW_MODE;
  try {
    return parseViewMode(JSON.parse(raw)) ?? DEFAULT_VIEW_MODE;
  } catch {
    return DEFAULT_VIEW_MODE;
  }
}

export function writeViewMode(mode: ViewMode): void {
  writeRaw(STORAGE_KEYS.viewMode, JSON.stringify(mode));
}

export function readHistory(): string[] {
  const raw = readRaw(STORAGE_KEYS.history);
  if (raw === null) return [];
  try {
    return parseHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeHistory(entries: readonly string[]): void {
  writeRaw(STORAGE_KEYS.history, JSON.stringify(entries));
}
