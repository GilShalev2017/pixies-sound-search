// Used only by useTrackSearch.ts, which calls `searchKeys.page(term,
// cursor)` as the TanStack Query `queryKey` for both its main query and
// its next-page prefetch. Keeping the key shape in one file means a term
// change and a cursor change are guaranteed to produce different cache
// entries, which is what lets TanStack Query cancel a stale request
// instead of racing it against a newer one.
/** One place that knows how cache keys are shaped. */
export const searchKeys = {
  all: ['tracks'] as const,
  search: (term: string) => [...searchKeys.all, 'search', term] as const,
  page: (term: string, cursor: string | null) => [...searchKeys.search(term), { cursor }] as const,
};
