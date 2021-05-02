const _queue: Promise<unknown>[] = [];

// A global queue of functions that will execute one after the other. The function must return a promise.
// fn is either a blocking function or a function that returns a promise
export function queueAction<K>(fn: () => Promise<K>): Promise<K> {
  const headPromise: Promise<unknown> = _queue.length
    ? _queue[_queue.length - 1]
    : Promise.resolve();
  // Execute fn regardless of the result of the existing promise. We
  // don't use finally here because finally can't modify the return value.
  const wrappedPromise = headPromise
    .then(
      (..._args) => fn(),
      (..._args) => fn()
    )
    .then(
      (value) => {
        _queue.shift();
        return value;
      },
      (e) => {
        _queue.shift();
        throw e;
      }
    );
  _queue.push(wrappedPromise);

  return wrappedPromise;
}

// Wrap a function to produce a function that will be queued when invoked
export function queuedAction<T extends unknown[], K>(
  fn: (...args: T) => Promise<K>,
  context?: unknown
): (...args: T) => Promise<K> {
  return (...args: T) => queueAction(() => fn.apply(context, args));
}
