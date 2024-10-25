/**
 * Transform an async function into a version that will only execute once at a time - if there's already
 * a version going, the existing promise will be returned instead of running it again.
 */
export function dedupePromise<T extends unknown[], K>(
  func: (...args: T) => Promise<K>,
): (...args: T) => Promise<K> {
  let promiseCache: Promise<K> | null = null;
  return async (...args: T) => {
    if (promiseCache) {
      return promiseCache;
    }
    promiseCache = func(...args);
    try {
      return await promiseCache;
    } finally {
      promiseCache = null;
    }
  };
}

// setTimeout as a promise
// TODO: consider using delay from 'es-toolkit' if we want to be able to cancel
// the delay with an abort signal
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
