'use client';

// The four "no real results to show yet" views ResultsPanel.tsx switches
// between: IdleState (nothing searched), ResultsSkeleton (loading),
// EmptyState (zero matches) and ErrorState (the search failed).
// ErrorState is the one place `toUserMessage` (src/lib/domain/errors.ts)
// is called, turning a caught SearchError into the copy shown here.
import type { ViewMode } from '@/lib/core/preferences';
import { toUserMessage } from '@/lib/domain/errors';
import { AlertIcon, SearchIcon, SparkIcon } from './Icons';

export function ResultsSkeleton({ viewMode, count = 6 }: { viewMode: ViewMode; count?: number }) {
  const items = Array.from({ length: count });

  if (viewMode === 'tile') {
    return (
      <ul aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((_, index) => (
          <li key={index} className="skeleton aspect-square rounded-2xl" />
        ))}
      </ul>
    );
  }

  return (
    <ul aria-hidden="true" className="flex flex-col gap-2">
      {items.map((_, index) => (
        <li key={index} className="flex items-center gap-3.5 rounded-2xl p-2.5">
          <span className="skeleton h-14 w-14 shrink-0 rounded-xl" />
          <span className="flex-1 space-y-2">
            <span className="skeleton block h-3 w-3/5 rounded-full" />
            <span className="skeleton block h-2.5 w-2/5 rounded-full" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Placeholder({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center animate-fade-in">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-accent">{icon}</span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted">{description}</p>
      {children}
    </div>
  );
}

export function IdleState() {
  return (
    <Placeholder
      icon={<SparkIcon />}
      title="Start with a search"
      description="Type an artist, a genre or a mood above. Results appear as you type — six at a time."
    />
  );
}

export function EmptyState({ term }: { term: string }) {
  return (
    <Placeholder
      icon={<SearchIcon />}
      title={`No results for “${term}”`}
      description="Nothing came back for that one. Try a different spelling, a broader term, or one of your recent searches."
    />
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-rose/30 bg-rose/[0.07] px-6 py-10 text-center animate-fade-in"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-rose/15 text-rose">
        <AlertIcon />
      </span>
      <p className="text-sm font-semibold text-ink">That search did not go through</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted">{toUserMessage(error)}</p>
      <button type="button" onClick={onRetry} className="btn mt-1">
        Try again
      </button>
    </div>
  );
}
