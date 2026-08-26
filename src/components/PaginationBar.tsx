'use client';

// Rendered by SoundExplorer.tsx below ResultsPanel.tsx. Its Prev/Next
// buttons call straight through to useTrackSearch.ts's goToPrevPage/
// goToNextPage (via the `search` prop object passed down); the
// list/tile toggle at the right calls useViewMode.ts's setter. It has no
// state of its own - `page`/`canPrev`/`canNext` all come from the hook.
import type { ViewMode } from '@/lib/core/preferences';
import { ChevronLeft, ChevronRight, ListIcon, TileIcon } from './Icons';

export interface PaginationBarProps {
  page: number;
  canPrev: boolean;
  canNext: boolean;
  isFetching: boolean;
  viewMode: ViewMode;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  /** id of the results region these controls drive. */
  controls: string;
}

export function PaginationBar({
  page,
  canPrev,
  canNext,
  isFetching,
  viewMode,
  onPrev,
  onNext,
  onViewModeChange,
  controls,
}: PaginationBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <nav aria-label="Result pages" className="flex items-center gap-2">
        <button type="button" className="btn" onClick={onPrev} disabled={!canPrev} aria-controls={controls}>
          <ChevronLeft width={16} height={16} />
          Previous
        </button>
        <button type="button" className="btn" onClick={onNext} disabled={!canNext} aria-controls={controls}>
          Next
          <ChevronRight width={16} height={16} />
        </button>
      </nav>

      <p className="order-last w-full text-center text-xs text-faint sm:order-none sm:w-auto">
        Page {page}
        {isFetching && <span className="ml-2 text-accent">updating…</span>}
      </p>

      <div
        role="group"
        aria-label="Result layout"
        className="flex items-center gap-1 rounded-full border border-line bg-white/[0.04] p-1"
      >
        <ViewButton
          active={viewMode === 'list'}
          label="List view"
          onClick={() => onViewModeChange('list')}
          controls={controls}
          icon={<ListIcon width={16} height={16} />}
        />
        <ViewButton
          active={viewMode === 'tile'}
          label="Tile view"
          onClick={() => onViewModeChange('tile')}
          controls={controls}
          icon={<TileIcon width={16} height={16} />}
        />
      </div>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  icon,
  controls,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  controls: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      aria-controls={controls}
      className={`grid h-8 w-9 place-items-center rounded-full transition ${
        active ? 'bg-white/85 text-canvas' : 'text-muted hover:bg-white/10 hover:text-ink'
      }`}
    >
      {icon}
    </button>
  );
}
