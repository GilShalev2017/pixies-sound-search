// Next.js App Router special file, same family as route.ts and error.tsx:
// this is the root layout, required at src/app/layout.tsx. Next.js renders
// it automatically around every page in the app - nothing in this
// codebase imports or calls `RootLayout` directly. `{children}` is
// whichever page matched the URL (for "/" that's src/app/page.tsx).
// Because this wraps everything, it's also where app-wide providers live:
// QueryProvider here sets up the TanStack Query client that useTrackSearch
// (src/hooks/useTrackSearch.ts) depends on.
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { QueryProvider } from '@/components/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PiXies — sound search',
  description:
    'Search a sound library, send a cover flying to the stage and play the track — built with Next.js, TypeScript and TanStack Query.',
};

export const viewport: Viewport = {
  themeColor: '#06060c',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="aurora" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-canvas"
        >
          Skip to main content
        </a>

        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
