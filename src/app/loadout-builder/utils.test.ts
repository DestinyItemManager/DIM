import { statTierWithHalf } from './utils';

describe('statTierWithHalf', () => {
  test('checks proper visual tier formatting', () => {
    expect(statTierWithHalf(-13)).toBe('-1.5');
    expect(statTierWithHalf(-7)).toBe('-1');
    expect(statTierWithHalf(-3)).toBe('-0.5');
    expect(statTierWithHalf(0)).toBe('0');
    expect(statTierWithHalf(7)).toBe('0.5');
    expect(statTierWithHalf(100)).toBe('10');
    expect(statTierWithHalf(103)).toBe('10');
    expect(statTierWithHalf(107)).toBe('10.5');
    expect(statTierWithHalf(127)).toBe('12.5');
  });
});
