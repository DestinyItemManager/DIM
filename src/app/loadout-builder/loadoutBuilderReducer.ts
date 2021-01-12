import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout/loadout-types';
import { useReducer } from 'react';
import {
  ArmorSet,
  LockedArmor2ModMap,
  LockedItemType,
  LockedMap,
  MinMaxIgnored,
  StatTypes,
} from './types';
import { addLockedItem, isLoadoutBuilderItem, removeLockedItem } from './utils';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
  modPicker: {
    open: boolean;
    initialQuery?: string;
    filterLegacy?: boolean;
  };
  perkPicker: {
    open: boolean;
    initialQuery?: string;
  };
  compareSet?: ArmorSet;
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
    lockedArmor2Mods: {},
    minimumPower: 750,
    selectedStoreId: selectedStoreId,
    modPicker: {
      open: false,
    },
    perkPicker: {
      open: false,
    },
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderState['statFilters'] }
  | { type: 'minimumPowerChanged'; minimumPower: number }
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | { type: 'lockedArmor2ModsChanged'; lockedArmor2Mods: LockedArmor2ModMap }
  | { type: 'openModPicker'; initialQuery?: string; filterLegacy?: boolean }
  | { type: 'closeModPicker' }
  | { type: 'openPerkPicker'; initialQuery?: string }
  | { type: 'closePerkPicker' }
  | { type: 'openCompareDrawer'; set: ArmorSet }
  | { type: 'closeCompareDrawer' };

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
    case 'lockedArmor2ModsChanged':
      return { ...state, lockedArmor2Mods: action.lockedArmor2Mods };
    case 'openModPicker':
      return {
        ...state,
        modPicker: {
          open: true,
          initialQuery: action.initialQuery,
          filterLegacy: action.filterLegacy,
        },
      };
    case 'closeModPicker':
      return { ...state, modPicker: { open: false } };
    case 'openPerkPicker':
      return { ...state, perkPicker: { open: true, initialQuery: action.initialQuery } };
    case 'closePerkPicker':
      return { ...state, perkPicker: { open: false } };
    case 'openCompareDrawer':
      return { ...state, compareSet: action.set };
    case 'closeCompareDrawer':
      return { ...state, compareSet: undefined };
  }
}

export function useLbState(stores: DimStore[], preloadedLoadout?: Loadout) {
  return useReducer(lbStateReducer, { stores, preloadedLoadout }, lbStateInit);
}
