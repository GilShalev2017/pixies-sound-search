// Rendered once by Home (src/app/page.tsx), above SoundExplorer. No
// 'use client' - it's a server component, so it costs nothing in the
// client JS bundle. `providerLabel` is the only data it needs, passed
// down from the server-side getActiveProvider() call in page.tsx.
import { SparkIcon } from './Icons';

/** Static, server-rendered chrome — no state, no client bundle. */
export function SiteHeader({ providerLabel }: { providerLabel: string }) {
  return (
    <header className="mx-auto flex w-full max-w-[88rem] flex-wrap items-center justify-between gap-3 px-4 pt-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent-strong),var(--color-cyan))] text-canvas shadow-[0_16px_40px_-16px_rgba(124,58,237,0.9)]">
          <SparkIcon width={22} height={22} />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Pi<span className="bg-[linear-gradient(120deg,var(--color-accent),var(--color-cyan))] bg-clip-text text-transparent">X</span>ies
          </h1>
          <p className="text-xs text-muted">Search sounds, stage the cover, press play.</p>
        </div>
      </div>

      <p className="chip">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
        Data source: {providerLabel}
      </p>
    </header>
  );
}
