import { DimStore } from 'app/inventory/store-types';
import { ThunkResult } from 'app/store/types';
import { type SendEquipmentStatusStreamDeckFn } from './async-module';
import { type UseStreamDeckSelectionFn } from './useStreamDeckSelection';

export interface LazyStreamDeck {
  startStreamDeckConnection?: () => ThunkResult;
  stopStreamDeckConnection?: () => ThunkResult;
  sendEquipmentStatusStreamDeck?: SendEquipmentStatusStreamDeckFn;
  useStreamDeckSelection?: UseStreamDeckSelectionFn;
}

export const lazyStreamDeck: LazyStreamDeck = {};

// wrapped lazy loaded functions

export const startStreamDeckConnection = () => lazyStreamDeck.startStreamDeckConnection!();

export const stopStreamDeckConnection = () => lazyStreamDeck.stopStreamDeckConnection!();

export const sendEquipmentStatusStreamDeck = (itemId: string, target: DimStore) =>
  lazyStreamDeck.sendEquipmentStatusStreamDeck!(itemId, target);

export const useStreamDeckSelection = (...args: Parameters<UseStreamDeckSelectionFn>) =>
  lazyStreamDeck.useStreamDeckSelection?.(...args) ?? {};

// run both lazy core and reducer modules
export const lazyLoadStreamDeck = async () => {
  const core = await import(/* webpackChunkName: "streamdeck" */ './async-module');
  const useStreamDeckSelection = await import(
    /* webpackChunkName: "streamdeck-selection" */ './useStreamDeckSelection'
  );
  // load only once
  if (!lazyStreamDeck.startStreamDeckConnection) {
    Object.assign(lazyStreamDeck, {
      ...core.default,
      ...useStreamDeckSelection.default,
    });
  }
};
