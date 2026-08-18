'use client';

/* eslint-disable @next/next/no-img-element -- artwork URLs come from whichever
   provider is plugged in, so the view must stay host-agnostic; `next/image`
   would force provider hostnames into next.config.ts. */

import { useState } from 'react';
import { WaveIcon } from './Icons';

export interface ArtworkProps {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}

/** Artwork with a graceful gradient fallback when the image is missing or 404s. */
export function Artwork({ src, alt, className = '', eager = false }: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span className={`relative block overflow-hidden bg-canvas-soft ${className}`}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-full w-full place-items-center bg-[linear-gradient(140deg,rgba(124,58,237,0.55),rgba(34,211,238,0.35))] text-white/70"
        >
          <WaveIcon width={22} height={22} />
        </span>
      )}
    </span>
  );
}
