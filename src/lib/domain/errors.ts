// Thrown by the provider implementations (src/lib/providers/mixcloud/index.ts,
// src/lib/providers/mock/index.ts) when a search fails, and caught in two
// places: the route handler (route.ts, server side - turns it into an HTTP
// error response) and searchClient.ts (client side - re-throws its own
// SearchError built from that response). `toUserMessage` below is called
// by StateViews.tsx to turn a caught SearchError into copy shown on screen.
/** Error taxonomy shared by the data layer and the UI. */
export type SearchErrorKind =
  | 'network' // the request never reached us (offline, DNS, CORS, ...)
  | 'upstream' // the provider answered with a failure
  | 'invalid' // we got an answer we cannot trust / parse
  | 'aborted'; // superseded by a newer request — never surfaced to the user

export class SearchError extends Error {
  readonly kind: SearchErrorKind;
  readonly status?: number;

  constructor(kind: SearchErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'SearchError';
    this.kind = kind;
    this.status = status;
  }

  static isAbort(error: unknown): boolean {
    if (error instanceof SearchError) return error.kind === 'aborted';
    return error instanceof DOMException && error.name === 'AbortError';
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof SearchError) {
    switch (error.kind) {
      case 'network':
        return 'We could not reach the sound service. Check your connection and try again.';
      case 'upstream':
        return error.status === 429
          ? 'The sound service is rate limiting us. Give it a few seconds and retry.'
          : 'The sound service returned an error. Please retry.';
      case 'invalid':
        return 'We received an unexpected response from the sound service.';
      default:
        return 'Something went wrong.';
    }
  }
  return 'Something went wrong while searching.';
}
