import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { useReducer } from 'react';
import {
  ArmorSet,
  LockedExotic,
  LockedItemType,
  LockedMap,
  MinMaxIgnored,
  StatTypes,
} from './types';
import { addLockedItem, isLoadoutBuilderItem, removeLockedItem } from './utils';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedMods: PluggableInventoryItemDefinition[];
  lockedExotic?: LockedExotic;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  modPicker: {
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
  | { type: 'lockExotic'; def: DestinyInventoryItemDefinition; bucketHash: BucketHashes }
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
        lockedExotic: undefined,
        statFilters: {
          Mobility: { min: 0, max: 10, ignored: false },
          Resilience: { min: 0, max: 10, ignored: false },
          Recovery: { min: 0, max: 10, ignored: false },
          Discipline: { min: 0, max: 10, ignored: false },
          Intellect: { min: 0, max: 10, ignored: false },
          Strength: { min: 0, max: 10, ignored: false },
        },
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
      const { def, bucketHash } = action;
      return { ...state, lockedExotic: { def, bucketHash } };
    }
    case 'removeLockedExotic': {
      return { ...state, lockedExotic: undefined };
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
