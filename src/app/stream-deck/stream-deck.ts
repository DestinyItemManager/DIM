import { ThunkResult } from 'app/store/types';
import { type UseStreamDeckSelectionFn } from './useStreamDeckSelection';

export interface LazyStreamDeck {
  start?: () => ThunkResult;
  stop?: () => ThunkResult;
  useSelection?: UseStreamDeckSelectionFn;
}

const lazyLoaded: LazyStreamDeck = {};

// lazy load the stream deck module when needed
export const lazyLoadStreamDeck = async () => {
  const core = await import(/* webpackChunkName: "streamdeck" */ './async-module');
  const useStreamDeckSelection = await import(
    /* webpackChunkName: "streamdeck-selection" */ './useStreamDeckSelection'
  );
  // load only once
  if (!lazyLoaded.start) {
    Object.assign(lazyLoaded, {
      ...core.default,
      ...useStreamDeckSelection.default,
    });
  }
};

// wrapped lazy loaded functions

export const startStreamDeckConnection = () => lazyLoaded.start!();

export const stopStreamDeckConnection = () => lazyLoaded.stop!();

export const useStreamDeckSelection: UseStreamDeckSelectionFn = (...args) =>
  lazyLoaded.useSelection?.(...args) ?? {};
