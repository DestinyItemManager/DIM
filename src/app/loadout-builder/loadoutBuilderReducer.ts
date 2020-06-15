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
import { isLoadoutBuilderItem, addLockedItem, removeLockedItem } from './generated-sets/utils';
import { statKeys } from './process';
import { Location } from 'history';
import { Loadout } from 'app/loadout/loadout-types';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
  query: string;
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
}

export const lbStateInit = ({
  stores,
  location,
}: {
  stores: DimStore[];
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}): LoadoutBuilderState => {
  let lockedMap: LockedMap = {};

  if (stores.length && location.state?.loadout) {
    for (const loadoutItem of location.state.loadout.items) {
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
    query: '',
    statOrder: statKeys,
    selectedStoreId: getCurrentStore(stores)?.id,
    assumeMasterwork: false,
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderState['statFilters'] }
  | { type: 'minimumPowerChanged'; minimumPower: number }
  | { type: 'queryChanged'; query: string }
  | { type: 'statOrderChanged'; statOrder: StatTypes[] }
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | { type: 'lockedSeasonalModsChanged'; lockedSeasonalMods: LockedModBase[] }
  | {
      type: 'lockedMapAndSeasonalModsChanged';
      lockedMap: LockedMap;
      lockedSeasonalMods: LockedModBase[];
    }
  | { type: 'lockedArmor2ModsChanged'; lockedArmor2Mods: LockedArmor2ModMap }
  | { type: 'assumeMasterworkChanged'; assumeMasterwork: boolean };

// TODO: Move more logic inside the reducer
export function lbStateReducer(
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
    case 'queryChanged':
      return { ...state, query: action.query };
    case 'statOrderChanged':
      return { ...state, statOrder: action.statOrder };
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
    case 'assumeMasterworkChanged':
      return { ...state, assumeMasterwork: action.assumeMasterwork };
  }
}
