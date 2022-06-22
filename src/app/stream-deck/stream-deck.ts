import { DimThunkDispatch, RootState, ThunkResult } from 'app/store/types';
import {
  removeClientIdentifier,
  removeStreamDeckSharedKey,
} from 'app/stream-deck/util/local-storage';

export const loadStreamDeckAsync = async () => (await import('./async-module')).default;

function lazyLoad(fn: string) {
  return (...args: any[]): ThunkResult =>
    async (dispatch: DimThunkDispatch, getState: () => RootState) => {
      const sd = await loadStreamDeckAsync();
      return sd[fn].call(null, dispatch, getState, ...args);
    };
}

export const startStreamDeckConnection = lazyLoad('startStreamDeckConnection');
export const stopStreamDeckConnection = lazyLoad('stopStreamDeckConnection');

export const streamDeckSelectItem = lazyLoad('streamDeckSelectItem');
export const streamDeckSelectLoadout = lazyLoad('streamDeckSelectLoadout');

// reset authorization token and regenerate client identifier
export const resetStreamDeckAuthorization = async () => {
  const sd = await loadStreamDeckAsync();
  sd.resetIdentifierOnStreamDeck();
  removeClientIdentifier();
  removeStreamDeckSharedKey();
};
