// Static help card, rendered by SoundExplorer.tsx next to RecentSearches.
// Purely descriptive - the shortcuts it lists are actually implemented
// in useSearchShortcuts.ts; this file just documents them for the user
// and has no behavior of its own.
const HINTS: ReadonlyArray<{ keys: string[]; description: string }> = [
  { keys: ['/'], description: 'Jump to the search box' },
  { keys: ['Enter'], description: 'Search now, without waiting for the debounce' },
  { keys: ['Tab'], description: 'Walk the results; Enter stages the cover' },
  { keys: ['Esc'], description: 'Clear the search box' },
];

/** Static help card — also documents that the whole flow is keyboard reachable. */
export function KeyboardHints() {
  return (
    <section aria-labelledby="hints-heading" className="panel flex flex-col gap-3 p-5">
      <h2 id="hints-heading" className="text-sm font-semibold tracking-wide text-ink">
        Keyboard
      </h2>
      <dl className="flex flex-col gap-2.5">
        {HINTS.map((hint) => (
          <div key={hint.description} className="flex items-start gap-3">
            <dt className="flex shrink-0 gap-1">
              {hint.keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-md border border-line bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.65rem] text-ink"
                >
                  {key}
                </kbd>
              ))}
            </dt>
            <dd className="text-[0.72rem] leading-relaxed text-faint">{hint.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
