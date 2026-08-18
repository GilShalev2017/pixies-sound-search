import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const SearchIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const ListIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);

export const TileIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </svg>
);

export const ChevronLeft = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);

export const ChevronRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...props}>
    <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const HistoryIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
    <path d="M12 10v4M12 17.2h.01" />
  </svg>
);

export const WaveIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 12h2M8 7v10M12 4v16M16 8.5v7M20.5 11h.5" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m12 3 1.9 5.4L19.5 10l-5.6 1.6L12 17l-1.9-5.4L4.5 10l5.6-1.6L12 3Z" />
  </svg>
);
