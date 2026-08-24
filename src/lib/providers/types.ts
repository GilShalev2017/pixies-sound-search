// The "port" in this project's port/adapter setup. Nothing here executes -
// it's the interface that src/lib/providers/mixcloud/index.ts and
// src/lib/providers/mock/index.ts both implement, and that
// registry.ts's return type promises to the route handler. As long as a
// provider satisfies this shape, GET() in route.ts doesn't know or care
// which one it's talking to.
import type { SearchQuery, TrackPage } from '@/lib/domain/track';

export interface ProviderSearchOptions extends SearchQuery {
  readonly signal?: AbortSignal;
}

/**
 * The port every sound provider implements.
 *
 * Adding a provider means adding one file that satisfies this interface and
 * registering it — no component, hook or route handler changes.
 */
export interface SoundProvider {
  readonly id: string;
  readonly label: string;
  /** Human readable attribution shown in the footer. */
  readonly attribution: string;
  search(options: ProviderSearchOptions): Promise<TrackPage>;
  /**
   * Guards cursors that travel through the client before coming back to the
   * server, so a crafted cursor can never turn the API route into an open proxy.
   */
  isValidCursor(cursor: string): boolean;
}
