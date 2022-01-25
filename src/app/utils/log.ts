/* eslint-disable no-console */

/**
 * A wrapper around console.log. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.log from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example infoLog("Manifest", "The manifest loaded")
 */
export function infoLog(tag: string, message: unknown, ...args: unknown[]) {
  console.log(`[${tag}]`, message, ...args);
}

/**
 * A wrapper around console.warn. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.warn from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example warnLog("Manifest", "The manifest is out of date")
 */
export function warnLog(tag: string, message: unknown, ...args: unknown[]) {
  console.warn(`[${tag}]`, message, ...args);
}

/**
 * A wrapper around console.warn that doesn't show the stack trace until you
 * expand it. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.warn from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example warnLogCollapsedStack("Manifest", "The manifest is out of date")
 */
export function warnLogCollapsedStack(tag: string, message: unknown, ...args: unknown[]) {
  console.groupCollapsed(`[${tag}]`, message);
  console.warn(`[${tag}]`, message, ...args);
  console.groupEnd();
}

/**
 * A wrapper around console.error. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.error from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example errorLog("Manifest", "The manifest failed to load")
 */
export function errorLog(tag: string, message: unknown, ...args: unknown[]) {
  console.error(`[${tag}]`, message, ...args);
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
