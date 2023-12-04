import { weakMemoize } from './memoize';

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
