const _queue: Promise<any>[] = [];

// A global queue of functions that will execute one after the other. The function must return a promise.
// fn is either a blocking function or a function that returns a promise
export function queueAction<K>(fn: () => Promise<K>) {
  let promise: Promise<K> = _queue.length ? _queue[_queue.length - 1] : Promise.resolve();
  // Execute fn regardless of the result of the existing promise. We
  // don't use finally here because finally can't modify the return value.
  promise = promise
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
  _queue.push(promise);

  return promise;
}

// Wrap a function to produce a function that will be queued when invoked
export function queuedAction<T extends any[], K>(
  fn: (...args: T) => Promise<K>,
  context?
): (...args: T) => Promise<K> {
  return (...args: T) => queueAction(() => fn.apply(context, args));
}
