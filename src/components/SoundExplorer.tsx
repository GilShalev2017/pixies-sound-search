'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useSearchShortcuts } from '@/hooks/useSearchShortcuts';
import { useTrackSearch } from '@/hooks/useTrackSearch';
import { useViewMode } from '@/hooks/useViewMode';
import { normalizeTerm } from '@/lib/core/history';
import type { Track } from '@/lib/domain/track';
import { flyToStage } from '@/lib/ui/fly';
import { ImageStage } from './ImageStage';
import { KeyboardHints } from './KeyboardHints';
import { PaginationBar } from './PaginationBar';
import { RecentSearches } from './RecentSearches';
import { ResultsPanel } from './ResultsPanel';
import { SearchBar } from './SearchBar';
import type { SelectTrackHandler } from './types';

const RESULTS_ID = 'search-results';
/** How long a debounced search must sit untouched before it counts as intentional. */
const HISTORY_COMMIT_DELAY_MS = 1200;

/**
 * The one stateful container.
 *
 * It wires three independent pieces together — the search hook (data + async),
 * the persistence hooks (history, view mode) and the presentational components —
 * and owns only what genuinely spans them: the input value, the selected track
 * and the flight animation.
 */
export function SoundExplorer() {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebouncedValue(inputValue, 300);
  const term = normalizeTerm(debouncedValue);

  const search = useTrackSearch(term);
  const history = useSearchHistory();
  const { viewMode, setViewMode } = useViewMode();
  const reducedMotion = usePrefersReducedMotion();

  const [selected, setSelected] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const stageFrameRef = useRef<HTMLDivElement>(null);
  const stagePlayRef = useRef<HTMLButtonElement>(null);
  /** Guards against an older flight finishing after a newer one. */
  const flightRef = useRef(0);
  /** Set when a selection came from the results list, so focus should follow it. */
  const shouldFocusStage = useRef(false);

  const { remember } = history;

  /* ---------------------------------------------------------------------- */
  /* Recent searches                                                         */
  /* ---------------------------------------------------------------------- */

  // A term is remembered when it is clearly intentional: submitted, picked from
  // history, acted on — or simply left alone for a moment after it returned
  // results. That keeps half-typed prefixes out of the list.
  useEffect(() => {
    if (!term || search.isLoading || search.error || search.isEmpty) return;
    const timer = setTimeout(() => remember(term), HISTORY_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [term, search.isLoading, search.error, search.isEmpty, remember]);

  const submit = useCallback(
    (value: string) => {
      const normalized = normalizeTerm(value);
      if (!normalized) return;
      setInputValue(normalized);
      remember(normalized);
    },
    [remember],
  );

  const searchFromHistory = useCallback(
    (value: string) => {
      submit(value);
      inputRef.current?.focus();
    },
    [submit],
  );

  /* ---------------------------------------------------------------------- */
  /* Result → image stage flight                                             */
  /* ---------------------------------------------------------------------- */

  const handleSelect = useCallback<SelectTrackHandler>(
    async (track, artworkElement) => {
      if (term) remember(term);
      setIsPlaying(false);

      const flightId = flightRef.current + 1;
      flightRef.current = flightId;

      if (artworkElement && stageFrameRef.current) {
        await flyToStage(artworkElement, stageFrameRef.current, {
          imageUrl: track.artwork.large ?? track.artwork.small,
          reducedMotion,
        });
      }

      // A newer selection started mid-flight — let it win.
      if (flightRef.current !== flightId) return;

      // Focus follows the content so keyboard users land on the play control;
      // the effect below runs after React has committed the new button.
      shouldFocusStage.current = true;
      setSelected(track);
    },
    [reducedMotion, remember, term],
  );

  // Focus management for the flight: once the staged track has rendered, move
  // focus to its play control so the keyboard journey continues where the eye is.
  useEffect(() => {
    if (!selected || !shouldFocusStage.current) return;
    shouldFocusStage.current = false;
    stagePlayRef.current?.focus();
  }, [selected]);

  const clearSearch = useCallback(() => setInputValue(''), []);
  useSearchShortcuts(inputRef, clearSearch);

  const clearSelection = useCallback(() => {
    flightRef.current += 1;
    setSelected(null);
    setIsPlaying(false);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-5 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Search + results */}
        <section aria-labelledby="search-heading" className="panel order-1 flex flex-col gap-5 p-5 lg:col-span-5">
          <h2 id="search-heading" className="sr-only">
            Search
          </h2>

          <SearchBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={submit}
            isBusy={search.isFetching}
            inputRef={inputRef}
            resultsId={RESULTS_ID}
          />

          <div className="min-h-[24rem] flex-1 scroll-slim">
            <ResultsPanel
              id={RESULTS_ID}
              term={term}
              items={search.items}
              viewMode={viewMode}
              isIdle={search.isIdle}
              isLoading={search.isLoading}
              isEmpty={search.isEmpty}
              error={search.error}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              onRetry={search.retry}
            />
          </div>

          <PaginationBar
            page={search.page}
            canPrev={search.canPrev}
            canNext={search.canNext}
            isFetching={search.isFetching}
            viewMode={viewMode}
            onPrev={search.goToPrevPage}
            onNext={search.goToNextPage}
            onViewModeChange={setViewMode}
            controls={RESULTS_ID}
          />
        </section>

        {/* Image stage */}
        <div className="order-2 lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <ImageStage
            track={selected}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onStop={() => setIsPlaying(false)}
            onClear={clearSelection}
            frameRef={stageFrameRef}
            playButtonRef={stagePlayRef}
          />
        </div>

        {/* Recent searches */}
        <div className="order-3 flex flex-col gap-5 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <RecentSearches
            entries={history.entries}
            activeTerm={term}
            onSelect={searchFromHistory}
            onRemove={history.forget}
            onClear={history.clear}
          />
          <KeyboardHints />
        </div>
      </div>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-faint">
        <p>{search.attribution ?? 'Track data is provided by the configured sound provider.'}</p>
        <p>
          Built with Next.js, TanStack Query and TypeScript
          {search.providerLabel ? ` · source: ${search.providerLabel}` : ''}
        </p>
      </footer>
    </div>
  );
}
