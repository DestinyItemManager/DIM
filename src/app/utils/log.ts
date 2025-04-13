/* eslint-disable no-console */

// Track how long it's been since the page load started and add that to each
// log. Most folks who paste us logs won't have timestamps enabled and they can
// be very useful.
const start = Date.now();
function logTime() {
  return (Date.now() - start) / 1000;
}

/**
 * A wrapper around console.log. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.log from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example infoLog("Manifest", "The manifest loaded")
 */
export function infoLog(tag: string, message: unknown, ...args: unknown[]) {
  console.log(`[${tag}]`, logTime(), message, ...args);
}

/**
 * A wrapper around console.warn. Use this when you mean to have logging in the shipped app.
 * Otherwise, we'll prevent console.warn from getting submitted via a lint rule.
 *
 * @param tag an informative label for categorizing this log
 * @example warnLog("Manifest", "The manifest is out of date")
 */
export function warnLog(tag: string, message: unknown, ...args: unknown[]) {
  console.warn(`[${tag}]`, logTime(), message, ...args);
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
  console.groupCollapsed(`[${tag}]`, logTime(), message);
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
  console.error(`[${tag}]`, logTime(), message, ...args);
}

/**
 * A wrapper around console.time. Use this when you mean to have timing in the shipped app.
 * Otherwise, we'll prevent console.time from getting submitted via a lint rule.
 *
 * Unlike the real console.time, this returns a function that is used to end the timer.
 */
export function timer(tag: string, message: string) {
  // Note: This will log the time when the timer started, but the log entry will
  // only appear when it ends.
  const label = `[${tag}] ${logTime()} ${message}`;
  console.time(label);
  return () => console.timeEnd(label);
}
