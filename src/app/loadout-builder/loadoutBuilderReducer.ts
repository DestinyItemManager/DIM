import {
  LockedMap,
  LockedModBase,
  LockedArmor2ModMap,
  StatTypes,
  MinMaxIgnored,
  LockedItemType,
  ModPickerCategories,
} from './types';
import { DimStore } from 'app/inventory/store-types';
import { getItemAcrossStores, getCurrentStore } from 'app/inventory/stores-helpers';
import { isLoadoutBuilderItem, addLockedItem, removeLockedItem } from './utils';
import { Loadout } from 'app/loadout/loadout-types';
import { useReducer } from 'react';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
}

const lbStateInit = ({
  stores,
  preloadedLoadout,
}: {
  stores: DimStore[];
  preloadedLoadout?: Loadout;
}): LoadoutBuilderState => {
  let lockedMap: LockedMap = {};

  let selectedStoreId = getCurrentStore(stores)?.id;

  if (stores.length && preloadedLoadout) {
    selectedStoreId = stores.find((store) => store.classType === preloadedLoadout.classType)?.id;

    for (const loadoutItem of preloadedLoadout.items) {
      if (loadoutItem.equipped) {
        const item = getItemAcrossStores(stores, loadoutItem);
        if (item && isLoadoutBuilderItem(item)) {
          lockedMap = {
            ...lockedMap,
            [item.bucket.hash]: addLockedItem(
              { type: 'item', item, bucket: item.bucket },
              lockedMap[item.bucket.hash]
            ),
          };
        }
      }
    }
  }
  return {
    lockedMap,
    statFilters: {
      Mobility: { min: 0, max: 10, ignored: false },
      Resilience: { min: 0, max: 10, ignored: false },
      Recovery: { min: 0, max: 10, ignored: false },
      Discipline: { min: 0, max: 10, ignored: false },
      Intellect: { min: 0, max: 10, ignored: false },
      Strength: { min: 0, max: 10, ignored: false },
    },
    lockedSeasonalMods: [],
    lockedArmor2Mods: {
      [ModPickerCategories.general]: [],
      [ModPickerCategories.helmet]: [],
      [ModPickerCategories.gauntlets]: [],
      [ModPickerCategories.chest]: [],
      [ModPickerCategories.leg]: [],
      [ModPickerCategories.classitem]: [],
      [ModPickerCategories.seasonal]: [],
    },
    minimumPower: 750,
    selectedStoreId: selectedStoreId,
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderState['statFilters'] }
  | { type: 'minimumPowerChanged'; minimumPower: number }
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | { type: 'lockedSeasonalModsChanged'; lockedSeasonalMods: LockedModBase[] }
  | {
      type: 'lockedMapAndSeasonalModsChanged';
      lockedMap: LockedMap;
      lockedSeasonalMods: LockedModBase[];
    }
  | { type: 'lockedArmor2ModsChanged'; lockedArmor2Mods: LockedArmor2ModMap };

// TODO: Move more logic inside the reducer
function lbStateReducer(
  state: LoadoutBuilderState,
  action: LoadoutBuilderAction
): LoadoutBuilderState {
  switch (action.type) {
    case 'changeCharacter':
      return {
        ...state,
        selectedStoreId: action.storeId,
        lockedMap: {},
        statFilters: {
          Mobility: { min: 0, max: 10, ignored: false },
          Resilience: { min: 0, max: 10, ignored: false },
          Recovery: { min: 0, max: 10, ignored: false },
          Discipline: { min: 0, max: 10, ignored: false },
          Intellect: { min: 0, max: 10, ignored: false },
          Strength: { min: 0, max: 10, ignored: false },
        },
        minimumPower: 0,
      };
    case 'statFiltersChanged':
      return { ...state, statFilters: action.statFilters };
    case 'minimumPowerChanged':
      return { ...state, minimumPower: action.minimumPower };
    case 'lockedMapChanged':
      return { ...state, lockedMap: action.lockedMap };
    case 'addItemToLockedMap': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        lockedMap: {
          ...state.lockedMap,
          [bucketHash]: addLockedItem(item, state.lockedMap[bucketHash]),
        },
      };
    }
    case 'removeItemFromLockedMap': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        lockedMap: {
          ...state.lockedMap,
          [bucketHash]: removeLockedItem(item, state.lockedMap[bucketHash]),
        },
      };
    }
    case 'lockedSeasonalModsChanged':
      return { ...state, lockedSeasonalMods: action.lockedSeasonalMods };
    case 'lockedMapAndSeasonalModsChanged':
      return {
        ...state,
        lockedMap: action.lockedMap,
        lockedSeasonalMods: action.lockedSeasonalMods,
      };
    case 'lockedArmor2ModsChanged':
      return { ...state, lockedArmor2Mods: action.lockedArmor2Mods };
  }
}

export function useLbState(stores: DimStore[], preloadedLoadout?: Loadout) {
  return useReducer(lbStateReducer, { stores, preloadedLoadout }, lbStateInit);
}
