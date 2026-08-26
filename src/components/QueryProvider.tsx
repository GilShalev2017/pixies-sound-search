'use client';

// Mounted once, in RootLayout (src/app/layout.tsx), around every page.
// It's what makes `useQuery` work at all inside useTrackSearch.ts -
// TanStack Query's hooks need a QueryClient somewhere above them in the
// tree, and this is that provider.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * One QueryClient per browser session (created lazily so it is never shared
 * between requests during server rendering).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
