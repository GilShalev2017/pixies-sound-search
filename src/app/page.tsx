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
