'use client';

// Rendered by ImageStage.tsx, only while `isPlaying` is true for the
// currently staged track. It embeds `track.embedUrl`, a field the active
// SoundProvider adapter (mixcloud/index.ts or mock/index.ts) already
// decided how to build - this component doesn't know or care which
// provider produced it.
import type { Track } from '@/lib/domain/track';
import { CloseIcon } from './Icons';

export interface TrackPlayerProps {
  track: Track;
  onStop: () => void;
}

/**
 * The provider's embeddable player, mounted under the artwork.
 * Which URL to embed is decided in the data layer (`track.embedUrl`), so this
 * component works for any provider that offers an iframe player.
 */
export function TrackPlayer({ track, onStop }: TrackPlayerProps) {
  if (!track.embedUrl) {
    return (
      <p className="rounded-2xl border border-line bg-white/[0.03] p-4 text-center text-xs text-muted animate-fade-in">
        This provider does not offer an embeddable player for this track.{' '}
        <a href={track.url} target="_blank" rel="noreferrer" className="text-cyan underline underline-offset-4">
          Open it on the provider’s site
        </a>
        .
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white/[0.03] animate-[rise_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-cyan">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
          </span>
          Playing
        </span>
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop playback and close the player"
          className="grid h-6 w-6 place-items-center rounded-lg text-faint transition hover:bg-white/10 hover:text-ink"
        >
          <CloseIcon width={13} height={13} />
        </button>
      </div>

      <iframe
        key={track.embedUrl}
        title={`Player for ${track.title} by ${track.author}`}
        src={track.embedUrl}
        width="100%"
        height="120"
        allow="autoplay; encrypted-media"
        loading="lazy"
        className="block w-full border-0"
      />
    </div>
  );
}
