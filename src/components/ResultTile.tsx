'use client';

import { useRef } from 'react';
import { formatDuration } from '@/lib/core/format';
import type { Track } from '@/lib/domain/track';
import { Artwork } from './Artwork';
import { PlayIcon } from './Icons';
import type { SelectTrackHandler } from './types';

export interface ResultTileProps {
  track: Track;
  index: number;
  isSelected: boolean;
  onSelect: SelectTrackHandler;
}

export function ResultTile({ track, index, isSelected, onSelect }: ResultTileProps) {
  const artRef = useRef<HTMLSpanElement>(null);
  const duration = formatDuration(track.durationSec);

  return (
    <li style={{ animationDelay: `${index * 55}ms` }} className="animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both]">
      <button
        type="button"
        onClick={() => onSelect(track, artRef.current)}
        aria-current={isSelected ? 'true' : undefined}
        className={`group relative block w-full overflow-hidden rounded-2xl border text-left transition duration-200 ${
          isSelected ? 'border-accent/60 ring-2 ring-accent/40' : 'border-line hover:border-white/25'
        }`}
      >
        <span ref={artRef} className="block">
          <Artwork src={track.artwork.large ?? track.artwork.small} alt="" className="aspect-square w-full" />
        </span>

        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,4,10,0.92),rgba(4,4,10,0.15)_55%,transparent)]" />

        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block truncate text-[0.82rem] font-semibold text-ink">{track.title}</span>
          <span className="mt-0.5 flex items-center justify-between gap-2 text-[0.68rem] text-muted">
            <span className="truncate">{track.author}</span>
            {duration && <span className="font-mono shrink-0">{duration}</span>}
          </span>
        </span>

        <span className="absolute right-2.5 top-2.5 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-white/15 opacity-0 backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <PlayIcon width={15} height={15} className="text-white" />
        </span>
      </button>
    </li>
  );
}
