// Next.js App Router "Route Handler". Its location on disk IS the route:
// src/app/api/tracks/search/route.ts -> GET /api/tracks/search
//
// Next.js itself imports this file and calls the exported `GET` function
// whenever a GET request hits that URL - nothing in this codebase calls
// GET directly, and it is not middleware (middleware runs earlier, before
// routing, from a separate src/middleware.ts file if one exists). Other
// HTTP verbs would be handled by exporting POST/PUT/DELETE/etc. from this
// same file; none are defined here, so Next.js auto-replies 405 to them.
//
// `fail` below is a plain local helper, not framework-invoked - GET calls
// it itself whenever it needs to return an error response.
import { NextResponse } from 'next/server';
import { QUERY_PARAM, type ErrorResponseBody, type SearchResponseBody } from '@/lib/api/contract';
import { SearchError } from '@/lib/domain/errors';
import { PAGE_SIZE } from '@/lib/domain/track';
import { getActiveProvider } from '@/lib/providers/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 24;

function fail(status: number, body: ErrorResponseBody): NextResponse<ErrorResponseBody> {
  return NextResponse.json(body, { status });
}

export async function GET(request: Request): Promise<NextResponse<SearchResponseBody | ErrorResponseBody>> {
  const provider = getActiveProvider();
  const url = new URL(request.url);

  const term = (url.searchParams.get(QUERY_PARAM.term) ?? '').trim();
  const cursor = url.searchParams.get(QUERY_PARAM.cursor);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get(QUERY_PARAM.limit)) || PAGE_SIZE));

  if (!term) {
    return fail(400, { error: { kind: 'invalid', message: 'A search term is required' } });
  }

  // Cursors round-trip through the browser, so they are untrusted input: only a
  // cursor the active provider recognises is ever followed.
  if (cursor && !provider.isValidCursor(cursor)) {
    return fail(400, { error: { kind: 'invalid', message: 'Unrecognised paging cursor' } });
  }

  try {
    const page = await provider.search({ term, limit, cursor, signal: request.signal });

    return NextResponse.json(
      {
        ...page,
        provider: { id: provider.id, label: provider.label, attribution: provider.attribution },
      },
      {
        headers: {
          // Cheap shared cache in front of the provider; the browser still gets
          // fresh data from TanStack Query's own cache policy.
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    if (SearchError.isAbort(error)) {
      // The client walked away — nothing to report.
      return fail(499, { error: { kind: 'aborted', message: 'Client aborted the request' } });
    }
    if (error instanceof SearchError) {
      const status = error.kind === 'upstream' ? (error.status ?? 502) : 502;
      return fail(status, { error: { kind: error.kind, message: error.message } });
    }
    return fail(500, { error: { kind: 'upstream', message: 'Unexpected server error' } });
  }
}
