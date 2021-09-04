import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useReducer } from 'react';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import { ArmorSet, LockedItemType, LockedMap, StatFilters } from './types';
import { addLockedItem, removeLockedItem } from './utils';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedMods: PluggableInventoryItemDefinition[];
  lockedExoticHash?: number;
  selectedStoreId?: string;
  statFilters: Readonly<StatFilters>;
  modPicker: {
    open: boolean;
    initialQuery?: string;
  };
  compareSet?: ArmorSet;
}

export const defaultStatFilters = {
  [StatHashes.Mobility]: { min: 0, max: 10, ignored: false },
  [StatHashes.Resilience]: { min: 0, max: 10, ignored: false },
  [StatHashes.Recovery]: { min: 0, max: 10, ignored: false },
  [StatHashes.Discipline]: { min: 0, max: 10, ignored: false },
  [StatHashes.Intellect]: { min: 0, max: 10, ignored: false },
  [StatHashes.Strength]: { min: 0, max: 10, ignored: false },
};
Object.freeze(defaultStatFilters);

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
    statFilters: _.cloneDeep(defaultStatFilters),
    lockedMods: [],
    selectedStoreId: selectedStoreId,
    modPicker: {
      open: false,
    },
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderState['statFilters'] }
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | {
      type: 'lockedModsChanged';
      lockedMods: PluggableInventoryItemDefinition[];
    }
  | { type: 'removeLockedMod'; mod: PluggableInventoryItemDefinition }
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'lockExotic'; lockedExoticHash: number }
  | { type: 'removeLockedExotic' }
  | { type: 'openModPicker'; initialQuery?: string }
  | { type: 'closeModPicker' }
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
        statFilters: _.cloneDeep(defaultStatFilters),
        lockedExoticHash: undefined,
      };
    case 'statFiltersChanged':
      return { ...state, statFilters: action.statFilters };
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
    case 'lockedModsChanged': {
      return {
        ...state,
        lockedMods: action.lockedMods,
      };
    }
    case 'addGeneralMods': {
      let currentGeneralModsCount = state.lockedMods.filter(
        (mod) => mod.plug.plugCategoryHash === armor2PlugCategoryHashesByName.general
      ).length;

      const newMods = [...state.lockedMods];
      const failures: string[] = [];

      for (const mod of action.mods) {
        if (currentGeneralModsCount < 5) {
          newMods.push(mod);
          currentGeneralModsCount++;
        } else {
          failures.push(mod.displayProperties.name);
        }
      }

      if (failures.length) {
        showNotification({
          title: t('LoadoutBuilder.UnableToAddAllMods'),
          body: t('LoadoutBuilder.UnableToAddAllModsBody', { mods: failures.join(', ') }),
          type: 'warning',
        });
      }

      return {
        ...state,
        lockedMods: newMods,
      };
    }
    case 'removeLockedMod': {
      const indexToRemove = state.lockedMods.findIndex((mod) => mod.hash === action.mod.hash);
      const newMods = [...state.lockedMods];
      newMods.splice(indexToRemove, 1);

      return {
        ...state,
        lockedMods: newMods,
      };
    }
    case 'lockExotic': {
      const { lockedExoticHash } = action;
      return { ...state, lockedExoticHash };
    }
    case 'removeLockedExotic': {
      return { ...state, lockedExoticHash: undefined };
    }
    case 'openModPicker':
      return {
        ...state,
        modPicker: {
          open: true,
          initialQuery: action.initialQuery,
        },
      };
    case 'closeModPicker':
      return { ...state, modPicker: { open: false } };
    case 'openCompareDrawer':
      return { ...state, compareSet: action.set };
    case 'closeCompareDrawer':
      return { ...state, compareSet: undefined };
  }
}

export function useLbState(stores: DimStore[], preloadedLoadout?: Loadout) {
  return useReducer(lbStateReducer, { stores, preloadedLoadout }, lbStateInit);
}
