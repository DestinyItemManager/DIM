/**
 * Produce an error message either from an Error object, or a stringy
 * representation of a non-Error object. Meant to be used when displaying or
 * logging errors from catch blocks.
 */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : JSON.stringify(e);
}

/**
 * If the parameter is not an Error, wrap a stringified version of it in an
 * Error. Meant to be used from catch blocks where the thrown type is not known.
 */
export function convertToError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  }
  return new Error(JSON.stringify(e));
}
