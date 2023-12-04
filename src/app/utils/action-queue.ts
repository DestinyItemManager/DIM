import { infoLog } from './log';

const _queue: Promise<unknown>[] = [];

// A global queue of functions that will execute one after the other. The function must return a promise.
// fn is either a blocking function or a function that returns a promise
export function queueAction<K>(fn: () => Promise<K>): Promise<K> {
  const headPromise: Promise<unknown> = _queue.length ? _queue.at(-1)! : Promise.resolve();

  // If available, run this task under a wake lock so the device doesn't sleep while the operation is running.
  const runPromise = async () => {
    let sentinel: WakeLockSentinel | undefined;
    if ('wakeLock' in navigator) {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch (e) {
        infoLog('wakelock', 'Could not acquire screen wake lock', e);
      }
    }
    try {
      return await fn();
    } finally {
      await sentinel?.release();
    }
  };

  // Execute fn regardless of the result of the existing promise. We
  // don't use finally here because finally can't modify the return value.
  const wrappedPromise = headPromise.then(runPromise, runPromise).then(
    (value) => {
      _queue.shift();
      return value;
    },
    (e) => {
      _queue.shift();
      throw e;
    },
  );
  _queue.push(wrappedPromise);

  return wrappedPromise;
}

// Wrap a function to produce a function that will be queued when invoked
export function queuedAction<T extends unknown[], K>(
  fn: (...args: T) => Promise<K>,
  context?: unknown,
): (...args: T) => Promise<K> {
  return (...args: T) => queueAction(() => fn.apply(context, args));
}
