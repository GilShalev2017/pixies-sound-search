// Next.js App Router special file: src/app/page.tsx is the "/" route.
// Next.js renders `Home` automatically for that URL, inside RootLayout
// (src/app/layout.tsx). No 'use client' here, so this runs on the server
// only, once per request - it calls getActiveProvider() just to read its
// static id/label for display, the actual searching happens later,
// client-side, when SoundExplorer's hooks hit /api/tracks/search.
import { SiteHeader } from '@/components/SiteHeader';
import { SoundExplorer } from '@/components/SoundExplorer';
import { getActiveProvider } from '@/lib/providers/registry';

/**
 * Server component: it only decides *which* provider is configured and renders
 * the interactive shell. All data fetching happens client-side through the
 * `/api/tracks/search` route, so the page itself stays static and instant.
 */
export default function Home() {
  const provider = getActiveProvider();

  return (
    <>
      <SiteHeader providerLabel={provider.label} />
      <main id="main" className="flex-1">
        <SoundExplorer />
      </main>
    </>
  );
}
