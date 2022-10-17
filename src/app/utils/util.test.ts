import { count, dedupePromise, objectifyArray, weakMemoize } from './util';

describe('count', () => {
  test('counts elements that match the predicate', () =>
    expect(count([1, 2, 3], (i) => i > 1)).toBe(2));
});

describe('objectifyArray', () => {
  test('keys objects by a property name that maps to an array', () => {
    const input = [{ key: [1, 3] }, { key: [2, 4] }];
    const output = objectifyArray(input, 'key');
    const expected = {
      '1': { key: [1, 3] },
      '2': { key: [2, 4] },
      '3': { key: [1, 3] },
      '4': { key: [2, 4] },
    };
    expect(output).toEqual(expected);
  });
});

describe('weakMemoize', () => {
  // This is all we can test - we can't test the "weak" part
  test('caches results of computation', () => {
    const memoized = weakMemoize(({ arg }: { arg: string }) => ({ prop: arg }));

    const arg = { arg: 'foo' };

    const val = memoized(arg);
    const val2 = memoized(arg);

    expect(val2).toBe(val);
    expect(memoized({ arg: 'bar' })).not.toBe(val);
  });
});

describe('dedupePromise', () => {
  test('caches inflight promises', async () => {
    let outerResolve: (value: string) => void = () => {};
    let outerReject: (e: Error) => void = () => {};
    let promiseFunctionInvoked = 0;

    const deduped = dedupePromise(
      () =>
        new Promise((resolve, reject) => {
          outerResolve = resolve;
          outerReject = reject;
          promiseFunctionInvoked++;
        })
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
