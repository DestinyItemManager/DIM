import { clamp, count } from './util';

describe('count', () => {
  test('counts elements that match the predicate', () =>
    expect(count([1, 2, 3], (i) => i > 1)).toBe(2));
});

describe('clamp', () => {
  test('clamps value between min and max', () => expect(clamp(20, 0, 50)).toBe(20));
});

describe('clamp', () => {
  test('clamps value between min and max', () => expect(clamp(-20, 0, 50)).toBe(0));
});

describe('clamp', () => {
  test('clamps value between min and max', () => expect(clamp(70, 0, 50)).toBe(50));
});
