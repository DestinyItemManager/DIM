/**
 * Stable empty versions of common data structures, to use in reducers.
 *
 * These always return the same instance so they'll always be referentially equal.
 */

const EMPTY_OBJ = Object.freeze({});
export function emptyObject<T extends Record<string, unknown> | Record<number, unknown>>(): T {
  return EMPTY_OBJ as T;
}

const EMPTY_ARRAY: readonly unknown[] = Object.freeze<unknown[]>([]);
export function emptyArray<T>(): T[] {
  return EMPTY_ARRAY as T[];
}

const EMPTY_SET = Object.freeze(new Set());
export function emptySet<T>(): Set<T> {
  return EMPTY_SET as Set<T>;
}

const EMPTY_MAP = Object.freeze(new Map());
export function emptyMap<K, V>(): Map<K, V> {
  return EMPTY_MAP as Map<K, V>;
}
