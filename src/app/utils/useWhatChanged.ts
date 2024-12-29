import { useRef } from 'react';
import { infoLog } from './log';

/**
 * A debugging hook that will print out what changed since the last render!
 *
 * @example
 *
 * useWhatChanged('MyComponent', {prop1, prop2, state1, state2});
 */
export function useWhatChanged<T extends Record<string, unknown>>(name: string, params: T) {
  const previousState = useRef<T>(undefined);

  if (!previousState.current) {
    infoLog('useWhatChanged', `${name} first render`);
  } else {
    for (const [key, val] of Object.entries(params)) {
      const previousVal = previousState.current[key];
      if (val !== previousVal) {
        infoLog('useWhatChanged', `${name} ${key}`, previousVal, val);
      }
    }
  }

  previousState.current = params;
}
