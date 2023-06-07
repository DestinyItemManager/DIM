import { infoLog, warnLog } from './utils/log';

let dimProfileRefreshInterval: number | undefined;

/**
 * Overrides the cooldown that applies to dim-api profile fetches. We want DIM
 * to not spam the server with every refresh, so there's a cooldown of about
 * 600 seconds. This overrides the cooldown with the value of `interval` in seconds.
 */
function overrideDimProfileRefreshInterval(interval: unknown) {
  if (interval === undefined) {
    dimProfileRefreshInterval = undefined;
    infoLog('debugging hooks', 'cleared DIM profile refresh interval override');
  } else if (typeof interval === 'number') {
    dimProfileRefreshInterval = interval;
    infoLog(
      'debugging hooks',
      'set DIM API refresh interval override to',
      dimProfileRefreshInterval,
      'seconds'
    );
  } else {
    warnLog('debugging hooks', 'invalid argument type', interval);
  }
}

export function getDimProfileRefreshIntervalOverride() {
  return dimProfileRefreshInterval;
}

export function installDebuggingHooks() {
  (window as any).DIM_overrideDimProfileRefreshInterval = overrideDimProfileRefreshInterval;
}
