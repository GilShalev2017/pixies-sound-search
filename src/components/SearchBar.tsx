'use client';

// Rendered by SoundExplorer.tsx, wired to its `inputValue` state and
// `submit` callback. Deliberately "dumb": it holds no state of its own,
// so typing, submitting and clearing are all reported upward via props
// rather than decided here - see the "Presentational" note below.
import { type RefObject, type SubmitEvent } from 'react';
import { CloseIcon, SearchIcon } from './Icons';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isBusy?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** id of the region this input controls, for `aria-controls`. */
  resultsId: string;
}

/** Presentational: it owns no data, it only reports what the user typed. */
export function SearchBar({ value, onChange, onSubmit, isBusy = false, inputRef, resultsId }: SearchBarProps) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label htmlFor="search-input" className="sr-only">
        Search tracks
      </label>

      <div className="group relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint transition-colors group-focus-within:text-accent">
          <SearchIcon width={20} height={20} />
        </span>

        <input
          id="search-input"
          ref={inputRef}
          type="search"
          value={value}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="Search for an artist, a mix, a mood…"
          aria-controls={resultsId}
          aria-describedby="search-hint"
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-full border border-line bg-white/5 py-3.5 pl-12 pr-11 text-[0.95rem] text-ink outline-none transition placeholder:text-faint hover:border-white/20 focus:border-accent/60 focus:bg-white/[0.08] [&::-webkit-search-cancel-button]:hidden"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-faint transition hover:bg-white/10 hover:text-ink"
          >
            <CloseIcon width={15} height={15} />
          </button>
        )}
      </div>

      <button type="submit" className="btn btn-primary sm:px-7" disabled={value.trim().length === 0}>
        {isBusy ? 'Searching…' : 'Go'}
      </button>

      <p id="search-hint" className="sr-only">
        Results update automatically as you type. Press Enter to search immediately.
      </p>
    </form>
  );
}
