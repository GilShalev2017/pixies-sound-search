// The only file the route handler talks to when it needs a provider.
// `getActiveProvider()` is called once per request, from GET() in
// src/app/api/tracks/search/route.ts - that's its single caller. It reads
// the SOUND_PROVIDER env var so which backend answers a search is a
// deployment-time choice, never something the browser can influence.
import { mixcloudProvider } from './mixcloud';
import { mockProvider } from './mock';
import type { SoundProvider } from './types';

export const providers = {
  [mixcloudProvider.id]: mixcloudProvider,
  [mockProvider.id]: mockProvider,
} as const satisfies Record<string, SoundProvider>;

export type ProviderId = keyof typeof providers;

export const DEFAULT_PROVIDER_ID: ProviderId = 'mixcloud';

export function getProvider(id: string | undefined): SoundProvider {
  if (id && id in providers) return providers[id as ProviderId];
  return providers[DEFAULT_PROVIDER_ID];
}

/**
 * Chosen once, on the server, from `SOUND_PROVIDER`. The client never picks a
 * provider — it just calls our own endpoint.
 */
export function getActiveProvider(): SoundProvider {
  return getProvider(process.env.SOUND_PROVIDER);
}
