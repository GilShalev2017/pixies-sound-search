// Called from the result/stage components that render a Track:
// ResultRow.tsx and ResultTile.tsx (formatDuration, formatCount) and
// ImageStage.tsx (all three, including formatYear). No caller outside
// src/components - these exist purely to turn raw domain-model numbers
// into display strings.
/** Display helpers. Pure, so they are testable and reusable across components. */

export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatCount(count: number | null): string | null {
  if (count === null || !Number.isFinite(count) || count < 0) return null;
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(count < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function formatYear(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : String(date.getUTCFullYear());
}
