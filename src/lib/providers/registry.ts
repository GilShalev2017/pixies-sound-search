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
