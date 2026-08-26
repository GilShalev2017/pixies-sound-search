'use client';

// The "Now showing" panel, rendered by SoundExplorer.tsx next to the
// results list. `frameRef` is the flight *target* lib/ui/fly.ts measures
// (the counterpart to ResultRow/ResultTile's `artRef` source); once the
// track prop is set, clicking the cover calls `onPlay`, which mounts
// TrackPlayer.tsx below it.
import type { RefObject } from 'react';
import { formatCount, formatDuration, formatYear } from '@/lib/core/format';
import type { Track } from '@/lib/domain/track';
import { Artwork } from './Artwork';
import { CloseIcon, PlayIcon, SparkIcon, WaveIcon } from './Icons';
import { TrackPlayer } from './TrackPlayer';

export interface ImageStageProps {
  track: Track | null;
  isPlaying: boolean;
  onPlay: () => void;
  /** Stop playback but keep the artwork on stage. */
  onStop: () => void;
  /** Remove the current selection entirely. */
  onClear: () => void;
  /** The flight target — the parent measures this node. */
  frameRef: RefObject<HTMLDivElement | null>;
  /** Focus lands here once a result has finished flying in. */
  playButtonRef: RefObject<HTMLButtonElement | null>;
}

export function ImageStage({ track, isPlaying, onPlay, onStop, onClear, frameRef, playButtonRef }: ImageStageProps) {
  const meta = track
    ? [formatDuration(track.durationSec), formatCount(track.playCount) && `${formatCount(track.playCount)} plays`, formatYear(track.publishedAt)].filter(
        (value): value is string => Boolean(value),
      )
    : [];

  return (
    <section aria-labelledby="stage-heading" className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="stage-heading" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink">
          <WaveIcon width={16} height={16} className="text-cyan" />
          Now showing
        </h2>
        {track && (
          <button
            type="button"
            onClick={onClear}
            className="chip transition hover:text-ink"
            aria-label="Clear the current selection"
          >
            <CloseIcon width={12} height={12} />
            Clear
          </button>
        )}
      </div>

      <div
        ref={frameRef}
        className="relative mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-[1.25rem] border border-line bg-canvas-soft"
      >
        {track ? (
          <button
            key={track.id}
            ref={playButtonRef}
            type="button"
            onClick={onPlay}
            aria-label={isPlaying ? `Now playing ${track.title} by ${track.author}` : `Play ${track.title} by ${track.author}`}
            className="group block h-full w-full animate-fade-in"
          >
            <Artwork src={track.artwork.large ?? track.artwork.small} alt={`Artwork for ${track.title}`} className="h-full w-full" eager />
            <span
              className={`absolute inset-0 grid place-items-center bg-black/35 transition duration-300 ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-white/25">
                <PlayIcon width={22} height={22} className="translate-x-[2px] text-white" />
              </span>
            </span>
            {!isPlaying && (
              <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(4,4,10,0.9),transparent)] p-4 pt-10 text-left">
                <span className="block text-xs uppercase tracking-[0.18em] text-cyan">Click to play</span>
              </span>
            )}
          </button>
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(124,58,237,0.35),transparent_65%)] text-center">
            <div className="flex flex-col items-center gap-3 px-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.07] text-accent">
                <SparkIcon />
              </span>
              <p className="text-sm font-medium text-ink">Pick a result</p>
              <p className="max-w-[15rem] text-xs leading-relaxed text-faint">
                Choose any track and its cover will fly up here. Click the cover to play it.
              </p>
            </div>
          </div>
        )}
      </div>

      {track && (
        <div className="text-center animate-fade-in">
          <p className="truncate text-sm font-semibold text-ink" title={track.title}>
            {track.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{track.author}</p>
          {meta.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              {meta.map((entry) => (
                <li key={entry} className="chip">
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {track && isPlaying && <TrackPlayer track={track} onStop={onStop} />}
    </section>
  );
}
