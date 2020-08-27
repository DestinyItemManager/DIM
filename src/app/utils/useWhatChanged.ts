import { useRef } from 'react';

/**
 * A debugging hook that will print out what changed since the last render!
 *
 * Example:
 *
 * useWhatChanged('MyComponent', {prop1, prop2, state1, state2});
 */
export function useWhatChanged<T extends object>(name: string, params: T) {
  const previousState = useRef<T>();

  if (!previousState.current) {
    console.log(`[useWhatChanged] ${name} first render`);
  } else {
    for (const [key, val] of Object.entries(params)) {
      const previousVal = previousState.current[key];
      if (val != previousVal) {
        console.log(`[useWhatChanged] ${name} ${key}`, previousVal, val);
      }
    }
  }

  previousState.current = params;
}
