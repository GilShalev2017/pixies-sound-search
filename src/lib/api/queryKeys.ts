/** One place that knows how cache keys are shaped. */
export const searchKeys = {
  all: ['tracks'] as const,
  search: (term: string) => [...searchKeys.all, 'search', term] as const,
  page: (term: string, cursor: string | null) => [...searchKeys.search(term), { cursor }] as const,
};
