import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { ThunkResult } from 'app/store/types';
import { LazyStreamDeck, LoadoutSelection } from 'app/stream-deck/interfaces';
import { removeClientIdentifier, removeStreamDeckToken } from 'app/stream-deck/util/local-storage';

export const lazyStreamDeck: LazyStreamDeck = {};

// wrapped lazy loaded functions

export const startStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.startStreamDeckConnection();

export const stopStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.stopStreamDeckConnection();

export const streamDeckSelectItem = (item: DimItem): ThunkResult =>
  lazyStreamDeck.core!.streamDeckSelectItem(item);

export const streamDeckSelectLoadout = (loadout: LoadoutSelection, store: DimStore) =>
  lazyStreamDeck.core!.streamDeckSelectLoadout(loadout, store);

// reset AuthorizationNotification token and regenerate client identifier
export const resetStreamDeckAuthorization = async () => {
  lazyStreamDeck.core?.resetIdentifierOnStreamDeck();
  removeClientIdentifier();
  removeStreamDeckToken();
};

// run both lazy core and reducer modules
export const lazyLoadStreamDeck = async () => {
  if (!lazyStreamDeck.core) {
    const core = (await import(/* webpackChunkName: "streamdeck" */ './async-module')).default;
    lazyStreamDeck.core = core;
  }
};
