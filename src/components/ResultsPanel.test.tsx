// Vitest + Testing Library, run by `npm test`. Exercises ResultsPanel.tsx
// directly with hand-built props (no real hook, no network) - possible
// only because that component takes everything as props and does no
// fetching itself (see its own header comment).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchError } from '@/lib/domain/errors';
import type { Track } from '@/lib/domain/track';
import { ResultsPanel, type ResultsPanelProps } from './ResultsPanel';

const track = (id: string): Track => ({
  id,
  title: `Title ${id}`,
  author: 'Artist',
  url: 'https://example.com',
  artwork: { small: null, large: null },
  durationSec: 120,
  playCount: 10,
  publishedAt: null,
  tags: [],
  embedUrl: null,
});

function renderPanel(overrides: Partial<ResultsPanelProps> = {}) {
  const props: ResultsPanelProps = {
    id: 'results',
    term: 'adele',
    items: [track('1'), track('2')],
    viewMode: 'list',
    isIdle: false,
    isLoading: false,
    isEmpty: false,
    error: null,
    selectedId: null,
    onSelect: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
  render(<ResultsPanel {...props} />);
  return props;
}

describe('<ResultsPanel />', () => {
  it('renders one activatable item per result, in a labelled list', () => {
    renderPanel();

    const list = screen.getByRole('list', { name: /search results for adele/i });
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('reports the selected result to assistive technology', () => {
    renderPanel({ selectedId: '2' });

    const selected = screen.getByRole('button', { name: /Title 2/ });
    expect(selected).toHaveAttribute('aria-current', 'true');
  });

  it('hands the clicked track back to the container', async () => {
    const user = userEvent.setup();
    const props = renderPanel();

    await user.click(screen.getByRole('button', { name: /Title 1/ }));

    expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), expect.anything());
  });

  it('marks the region busy while loading and shows no results', () => {
    renderPanel({ isLoading: true, items: [] });

    expect(document.getElementById('results')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('list', { name: /search results/i })).not.toBeInTheDocument();
  });

  it('explains an empty result set', () => {
    renderPanel({ isEmpty: true, items: [] });

    // Once in the live region for screen readers, once on screen.
    expect(screen.getAllByText(/No results for/i)).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('No results for adele.');
  });

  it('shows a retryable alert on failure', async () => {
    const user = userEvent.setup();
    const props = renderPanel({ error: new SearchError('upstream', 'nope', 503), items: [] });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('prompts for a search before anything has been typed', () => {
    renderPanel({ isIdle: true, items: [], term: '' });
    expect(screen.getByText(/start with a search/i)).toBeInTheDocument();
  });

  it('switches to a tile grid without changing the data it renders', () => {
    renderPanel({ viewMode: 'tile' });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('list', { name: /search results for adele/i })).toBeInTheDocument();
  });
});
