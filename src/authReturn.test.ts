import { authStateMatches } from './authReturn';

test('auth state matches only when a stored state comes back unchanged', () => {
  expect(authStateMatches('abc-123', 'abc-123')).toBe(true);
});

test('auth state does not match when the values differ', () => {
  expect(authStateMatches('abc-123', 'def-456')).toBe(false);
  expect(authStateMatches(null, 'abc-123')).toBe(false);
});

test('a missing or empty stored state is never a match', () => {
  // The important case: a callback with no state at all must not pass just
  // because localStorage was empty (both sides null/empty).
  expect(authStateMatches(null, null)).toBe(false);
  expect(authStateMatches('', '')).toBe(false);
  expect(authStateMatches('abc-123', null)).toBe(false);
  expect(authStateMatches('abc-123', '')).toBe(false);
});
