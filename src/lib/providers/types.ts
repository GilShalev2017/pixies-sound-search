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
