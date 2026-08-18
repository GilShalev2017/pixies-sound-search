'use client';

import type { ViewMode } from '@/lib/core/preferences';
import type { Track } from '@/lib/domain/track';
import { ResultRow } from './ResultRow';
import { ResultTile } from './ResultTile';
import { EmptyState, ErrorState, IdleState, ResultsSkeleton } from './StateViews';
import type { SelectTrackHandler } from './types';

export interface ResultsPanelProps {
  id: string;
  term: string;
  items: readonly Track[];
  viewMode: ViewMode;
  isIdle: boolean;
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
  selectedId: string | null;
  onSelect: SelectTrackHandler;
  onRetry: () => void;
}

/**
 * Renders exactly one of: idle, loading, error, empty, results.
 * It receives everything as props — no fetching here, so the same panel can be
 * driven by a different hook, a story, or a test.
 */
export function ResultsPanel({
  id,
  term,
  items,
  viewMode,
  isIdle,
  isLoading,
  isEmpty,
  error,
  selectedId,
  onSelect,
  onRetry,
}: ResultsPanelProps) {
  const status = (() => {
    if (isIdle) return 'Type a search term to begin.';
    if (isLoading) return 'Searching…';
    if (error) return 'The search failed.';
    if (isEmpty) return `No results for ${term}.`;
    return `${items.length} result${items.length === 1 ? '' : 's'} for ${term}, shown as a ${viewMode === 'tile' ? 'tile grid' : 'list'}.`;
  })();

  return (
    <div id={id} aria-busy={isLoading}>
      {/* Single live region: screen readers hear one sentence per state change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {isIdle ? (
        <IdleState />
      ) : isLoading ? (
        <ResultsSkeleton viewMode={viewMode} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <EmptyState term={term} />
      ) : viewMode === 'tile' ? (
        <ul aria-label={`Search results for ${term}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((track, index) => (
            <ResultTile
              key={track.id}
              track={track}
              index={index}
              isSelected={track.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : (
        <ul aria-label={`Search results for ${term}`} className="flex flex-col gap-1.5">
          {items.map((track, index) => (
            <ResultRow
              key={track.id}
              track={track}
              index={index}
              isSelected={track.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
