import { DimStore } from 'app/inventory/store-types';
import { ThunkResult } from 'app/store/types';
import { LazyStreamDeck } from 'app/stream-deck/interfaces';

export const lazyStreamDeck: LazyStreamDeck = {};

// wrapped lazy loaded functions

export const startStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.startStreamDeckConnection();

export const stopStreamDeckConnection = (): ThunkResult =>
  lazyStreamDeck.core!.stopStreamDeckConnection();

export const sendEquipmentStatusStreamDeck = (itemId: string, target: DimStore): ThunkResult =>
  lazyStreamDeck.core!.sendEquipmentStatusStreamDeck(itemId, target);

// run both lazy core and reducer modules
export const lazyLoadStreamDeck = async () => {
  if (!lazyStreamDeck.core) {
    const core = (await import(/* webpackChunkName: "streamdeck" */ './async-module')).default;
    lazyStreamDeck.core = core;
  }
};
