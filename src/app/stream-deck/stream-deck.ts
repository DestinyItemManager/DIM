import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { ThunkResult } from 'app/store/types';
import { LazyStreamDeck, StreamDeckState } from 'app/stream-deck/interfaces';
import { DeferredPromise } from 'app/stream-deck/util/deferred';
import { removeClientIdentifier, removeStreamDeckToken } from 'app/stream-deck/util/local-storage';

export const lazyStreamDeck: LazyStreamDeck = {};

// load core function
const loadStreamDeckAsync = async () => {
  if (!lazyStreamDeck.core) {
    lazyStreamDeck.core = (await import('./async-module')).default;
  }
};

// load stream deck reducer
const loadStreamDeckReducer = async () => {
  if (!lazyStreamDeck.reducer) {
    lazyStreamDeck.reducer = (await import('./reducer')).default;
  }
};

// wrapped lazy loaded functions

export const startStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.startStreamDeckConnection();

export const stopStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.stopStreamDeckConnection();

export const streamDeckSelectItem = (item: DimItem): ThunkResult =>
  lazyStreamDeck.core!.streamDeckSelectItem(item);

export const streamDeckSelectLoadout = (loadout: Loadout, store: DimStore) =>
  lazyStreamDeck.core!.streamDeckSelectLoadout(loadout, store);

// reset AuthorizationNotification token and regenerate client identifier
export const resetStreamDeckAuthorization = async () => {
  lazyStreamDeck.core!.resetIdentifierOnStreamDeck();
  removeClientIdentifier();
  removeStreamDeckToken();
};

// run both lazy loaded modules
export const lazyLoadStreamDeck = async () =>
  Promise.all([loadStreamDeckReducer(), loadStreamDeckAsync()]);

// initial stream deck store state
export const streamDeckInitialState: StreamDeckState = {
  connected: false,
  selectionPromise: new DeferredPromise(),
};
