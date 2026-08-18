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
