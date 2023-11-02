/** Generic TypeScript type utilities */

/** Extracts the type of elements of an array */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * A lookup table from key to value, where not all keys may be mapped. We use these often
 * to special case some logic for certain subsets of strings or hashes. Use Record<K,V> if
 * the table is meant to be complete for all possible values of K. This can also be helpful
 * to re-type imported JSON files as lookup tables.
 */
export type LookupTable<K extends keyof any, V> = {
  readonly [P in K]?: V | undefined;
};

/**
 * A convenience for a lookup table keyed by a hash (number). This also accepts strings
 * since you can use string version of numbers to read into objects keyed by number just fine,
 * and JSON files are always keyed by string.
 */
export type HashLookup<V> = LookupTable<number | string, V>;

/**
 * A convenience for a lookup table keyed by a string. Equivalent to NodeJS.ReadonlyDict.
 */
export type StringLookup<V> = LookupTable<string, V>;

/** performs `key in obj` but properly narrows `key` */
/*@__INLINE__*/
export function isIn<O extends Record<string | number, any>>(key: keyof O, obj: O): key is keyof O {
  return key in obj;
}

/** performs `Object.values()` but properly types the values when the input object has number keys. */
/*@__INLINE__*/
export function objectValues<T>(
  obj: { [key: string]: T } | { [key: number]: T } | ArrayLike<T>,
): T[] {
  return Object.values(obj);
}
