'use client';

// Next.js App Router special file: src/app/error.tsx is a "global error
// boundary" for the whole app (named exactly `error.tsx`, must be a
// client component, must default-export a component that takes
// `error`/`reset`). Next.js mounts this automatically, in place of
// RootLayout's children, whenever a rendering error escapes any page or
// component below it - nothing here is called from our own code. `reset`
// is supplied by Next.js; calling it tries re-rendering the tree that crashed.
import { useEffect } from 'react';

/** Last line of defence: a rendering crash still leaves the user somewhere to go. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="panel max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">Something broke on this page</h1>
        <p className="mt-2 text-sm text-muted">
          The app hit an unexpected error. Nothing was lost — your recent searches are still saved.
        </p>
        <button type="button" onClick={reset} className="btn btn-primary mt-5">
          Reload the view
        </button>
      </div>
    </main>
  );
}
