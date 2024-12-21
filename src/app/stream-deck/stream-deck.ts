import { ThunkResult } from 'app/store/types';

export interface LazyStreamDeck {
  start?: () => ThunkResult;
  stop?: () => ThunkResult;
}

const lazyLoaded: LazyStreamDeck = {};

// lazy load the stream deck module when needed
export const lazyLoadStreamDeck = async () => {
  const core = await import(/* webpackChunkName: "streamdeck" */ './async-module');
  // load only once
  if (!lazyLoaded.start) {
    Object.assign(lazyLoaded, {
      ...core.default,
    });
  }
};

// wrapped lazy loaded functions

export const startStreamDeckConnection = () => lazyLoaded.start!();

export const stopStreamDeckConnection = () => lazyLoaded.stop!();
