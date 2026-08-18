/**
 * Domain model.
 *
 * These types are the *only* shape the UI knows about. Provider-specific
 * payloads (Mixcloud, SoundCloud, ...) are mapped into this model inside the
 * data layer, so swapping the sound provider never reaches a component.
 */

export interface Artwork {
  /** Small square image, used in list rows. */
  readonly small: string | null;
  /** Large square image, used in tiles and in the image stage. */
  readonly large: string | null;
}

export interface Track {
  /** Stable, provider-scoped identifier (used as a React key and for equality). */
  readonly id: string;
  readonly title: string;
  readonly author: string;
  /** Canonical page for the track on the provider's website. */
  readonly url: string;
  readonly artwork: Artwork;
  readonly durationSec: number | null;
  readonly playCount: number | null;
  readonly publishedAt: string | null;
  readonly tags: readonly string[];
  /** `src` for an embeddable player iframe, when the provider offers one. */
  readonly embedUrl: string | null;
}

/**
 * One page of results.
 *
 * Paging is cursor based on purpose: providers (Mixcloud included) hand back an
 * opaque "next page" token, and re-deriving it from an offset drifts as soon as
 * the underlying result set changes.
 */
export interface TrackPage {
  readonly items: readonly Track[];
  readonly nextCursor: string | null;
  readonly prevCursor: string | null;
}

export interface SearchQuery {
  readonly term: string;
  readonly limit: number;
  readonly cursor?: string | null;
}

export const PAGE_SIZE = 6;
