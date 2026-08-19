'use client';

import { CloseIcon, HistoryIcon } from './Icons';

export interface RecentSearchesProps {
  entries: readonly string[];
  activeTerm: string;
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}

export function RecentSearches({ entries, activeTerm, onSelect, onRemove, onClear }: RecentSearchesProps) {
  const normalizedActive = activeTerm.trim().toLocaleLowerCase();

  return (
    <section aria-labelledby="recent-heading" className="panel flex flex-col gap-4 p-5">
      <header className="flex items-center justify-between gap-2">
        <h2 id="recent-heading" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink">
          <HistoryIcon width={16} height={16} className="text-accent" />
          Recent searches
        </h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[0.7rem] text-faint underline-offset-4 transition hover:text-ink hover:underline"
          >
            Clear
          </button>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="text-xs leading-relaxed text-faint">
          Your last five searches will show up here — and they will still be here the next time you visit.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((term, index) => {
            const isActive = term.toLocaleLowerCase() === normalizedActive;
            return (
              <li
                key={term}
                style={{ animationDelay: `${index * 40}ms` }}
                className="group relative animate-[rise_0.4s_ease-out_both]"
              >
                <button
                  type="button"
                  onClick={() => onSelect(term)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 pr-9 text-left text-sm transition ${
                    isActive
                      ? 'border-accent/50 bg-accent/10 text-ink'
                      : 'border-transparent bg-white/[0.03] text-muted hover:border-line hover:bg-white/[0.07] hover:text-ink'
                  }`}
                >
                  {/* Decorative rank: hidden from the accessible name so the
                      button announces just the search term. */}
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.06] font-mono text-[0.65rem] text-faint"
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{term}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(term)}
                  aria-label={`Remove ${term} from recent searches`}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-faint opacity-0 transition hover:bg-white/10 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <CloseIcon width={13} height={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
