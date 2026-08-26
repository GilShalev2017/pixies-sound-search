// Just the `SelectTrackHandler` type, shared by every component that can
// trigger a selection (ResultRow.tsx, ResultTile.tsx) and by
// SoundExplorer.tsx, which implements it as `handleSelect` and passes it
// down through ResultsPanel.tsx.
import type { Track } from '@/lib/domain/track';

/**
 * The view hands back the DOM node that holds the artwork so the container can
 * animate it towards the image stage. The components themselves stay ignorant
 * of what happens next.
 */
export type SelectTrackHandler = (track: Track, artworkElement: HTMLElement | null) => void;
