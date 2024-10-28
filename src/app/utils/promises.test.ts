import { noop } from './functions';
import { dedupePromise } from './promises';

describe('dedupePromise', () => {
  test('caches inflight promises', async () => {
    let outerResolve: (value: string) => void = noop;
    let outerReject: (e: Error) => void = noop;
    let promiseFunctionInvoked = 0;

    const deduped = dedupePromise(
      () =>
        new Promise((resolve, reject) => {
          outerResolve = resolve;
          outerReject = reject;
          promiseFunctionInvoked++;
        }),
    );

    // Multiple calls before the promise resolves return the same promise
    const promise1 = deduped();
    const promise2 = deduped();
    expect(promiseFunctionInvoked).toBe(1);

    outerResolve('foo');

    // Since they're the same promise, they both resolve to the same value
    const [val1, val2] = await Promise.all([promise1, promise2]);
    expect(val1).toBe('foo');
    expect(val2).toBe('foo');

    // After the first promise resolved, calling again is a new promise
    const promise3 = deduped();
    expect(promiseFunctionInvoked).toBe(2);

    // If the promise rejects, we see it
    outerReject(new Error('done'));

    await expect(async () => {
      await promise3;
    }).rejects.toThrow('done');

    // And rejection also clears the cache so the next invocation gets a new promise
    const promise4 = deduped();
    expect(promiseFunctionInvoked).toBe(3);
    outerResolve('baz');
    const val4 = await promise4;
    expect(val4).toBe('baz');
  });
});
