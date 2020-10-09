/* eslint-disable no-console */

/**
 * A wrapper around log. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent log from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example infoLog("Manifest", "The manifest loaded")
 */
export function infoLog(tag: string, ...args: any[]) {
  console.log(`[${tag}]`, ...args);
}

/**
 * A wrapper around warnLog. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent warnLog from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example warn("Manifest", "The manifest loaded")
 */
export function warnLog(tag: string, ...args: any[]) {
  console.warn(`[${tag}]`, ...args);
}

/**
 * A wrapper around errorLog. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent errorLog from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example error("Manifest", "The manifest loaded")
 */
export function errorLog(tag: string, ...args: any[]) {
  console.error(`[${tag}]`, ...args);
}

/**
 * A wrapper around console.time. Use this when you mean to have timing in the shipped app.
 * Otherwise, we'll prevent console.time from getting submitted via a lint rule.
 *
 * Unlike the real console.time, this returns a function that is used to end the timer.
 */
export function timer(tag: string) {
  console.time(tag);
  return () => console.timeEnd(tag);
}
