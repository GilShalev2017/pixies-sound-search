'use client';

import { useRef } from 'react';
import { formatCount, formatDuration } from '@/lib/core/format';
import type { Track } from '@/lib/domain/track';
import { Artwork } from './Artwork';
import { PlayIcon } from './Icons';
import type { SelectTrackHandler } from './types';

export interface ResultRowProps {
  track: Track;
  index: number;
  isSelected: boolean;
  onSelect: SelectTrackHandler;
}

export function ResultRow({ track, index, isSelected, onSelect }: ResultRowProps) {
  const artRef = useRef<HTMLSpanElement>(null);
  const duration = formatDuration(track.durationSec);
  const plays = formatCount(track.playCount);

  return (
    <li style={{ animationDelay: `${index * 45}ms` }} className="animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both]">
      <button
        type="button"
        onClick={() => onSelect(track, artRef.current)}
        aria-current={isSelected ? 'true' : undefined}
        className={`group flex w-full items-center gap-3.5 rounded-2xl border p-2.5 text-left transition duration-200 ${
          isSelected
            ? 'border-accent/50 bg-accent/10'
            : 'border-transparent hover:border-line hover:bg-white/[0.06]'
        }`}
      >
        <span ref={artRef} className="relative shrink-0">
          <Artwork
            src={track.artwork.small ?? track.artwork.large}
            alt=""
            className="h-14 w-14 rounded-xl ring-1 ring-white/10"
          />
          <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/45 opacity-0 transition group-hover:opacity-100">
            <PlayIcon width={16} height={16} className="text-white" />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.92rem] font-medium text-ink">{track.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">{track.author}</span>
        </span>

        <span className="hidden shrink-0 flex-col items-end gap-1 text-[0.7rem] text-faint sm:flex">
          {duration && <span className="font-mono">{duration}</span>}
          {plays && <span>{plays} plays</span>}
        </span>
      </button>
    </li>
  );
}
