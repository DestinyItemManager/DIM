const _queue: Promise<void>[] = [];

// A global queue of functions that will execute one after the other. The function must return a promise.
// fn is either a blocking function or a function that returns a promise
export function queueAction(fn: () => Promise<any>) {
  let promise = _queue.length ? _queue[_queue.length - 1] : Promise.resolve();
  // Execute fn regardless of the result of the existing promise. We
  // don't use finally here because finally can't modify the return value.
  promise = promise
    .then(
      () => {
        return fn();
      },
      () => {
        return fn();
      }
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
): (...args: T) => Promise<any> {
  return (...args: T) => {
    return queueAction(() => {
      return fn.apply(context, args);
    });
  };
}
