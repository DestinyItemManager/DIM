import { ComponentType, lazy, LazyExoticComponent } from 'react';
import { delay } from './promises';
/**
 * Was this error a failure to load a lazily-imported JS or CSS chunk? webpack throws a
 * ChunkLoadError for JS and an error with code CSS_CHUNK_LOAD_FAILED for CSS.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.name === 'ChunkLoadError' ||
    (error as { code?: string }).code === 'CSS_CHUNK_LOAD_FAILED' ||
    /Loading (?:CSS )?chunk [\w-]+ failed/i.test(error.message)
  );
}

/**
 * Retry a dynamic import that failed to load a chunk. These failures are usually transient -
 * a network blip, or the service worker taking control of the page mid-navigation during an
 * update - and a second attempt a moment later succeeds (we intentionally keep old chunk files
 * on the server, so the reference stays valid). Non-chunk errors, and chunk errors that survive
 * the retries, are rethrown so the error boundary still handles them.
 */
async function retryChunkImport<T>(
  factory: () => Promise<T>,
  retries = 2,
  delayMs = 300,
): Promise<T> {
  try {
    return await factory();
  } catch (e) {
    if (retries > 0 && isChunkLoadError(e)) {
      await delay(delayMs);
      return retryChunkImport(factory, retries - 1, delayMs);
    }
    throw e;
  }
}

/**
 * Like React.lazy, but retries the import a couple of times if it fails with a chunk-load error
 * before giving up. Use this instead of lazy() for route/component code-splitting.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => retryChunkImport(factory));
}
