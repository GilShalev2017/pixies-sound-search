import type { Track } from '@/lib/domain/track';

/**
 * The view hands back the DOM node that holds the artwork so the container can
 * animate it towards the image stage. The components themselves stay ignorant
 * of what happens next.
 */
export type SelectTrackHandler = (track: Track, artworkElement: HTMLElement | null) => void;
