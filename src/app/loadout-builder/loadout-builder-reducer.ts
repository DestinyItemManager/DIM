import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import _ from 'lodash';
import { useReducer } from 'react';
import {
  ArmorSet,
  LockedItemType,
  LockedMap,
  LockedMod,
  LockedMods,
  MinMaxIgnored,
  StatTypes,
} from './types';
import { addLockedItem, isLoadoutBuilderItem, removeLockedItem } from './utils';

export interface LoadoutBuilderState {
  lockedMap: LockedMap;
  lockedMods: LockedMods;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  modPicker: {
    open: boolean;
    initialQuery?: string;
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
    lockedMods: {},
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
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | {
      type: 'lockedModsChanged';
      lockedMods: {
        [plugCategoryHash: number]: PluggableInventoryItemDefinition[] | undefined;
      };
    }
  | { type: 'removeLockedArmor2Mod'; mod: LockedMod }
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'openModPicker'; initialQuery?: string }
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
      let modKey = 0;
      return {
        ...state,
        lockedMods: _.mapValues(action.lockedMods, (plugs) =>
          plugs?.map((plug) => ({ key: modKey++, modDef: plug }))
        ),
      };
    }
    case 'addGeneralMods': {
      const genrealMods = state.lockedMods[armor2PlugCategoryHashesByName.general];
      const newGeneralMods = genrealMods?.length ? [...genrealMods] : [];
      const failures: string[] = [];
      let largestModKey = Math.max(
        ...Object.values(state.lockedMods)
          .flat()
          .map((locked) => locked?.key || 0)
      );

      for (const mod of action.mods) {
        if (newGeneralMods.length === 5) {
          failures.push(mod.displayProperties.name);
        } else {
          newGeneralMods.push({ key: ++largestModKey, modDef: mod });
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
        lockedMods: {
          ...state.lockedMods,
          [armor2PlugCategoryHashesByName.general]: newGeneralMods,
        },
      };
    }
    case 'removeLockedArmor2Mod': {
      const { plugCategoryHash } = action.mod.modDef.plug;
      return {
        ...state,
        lockedMods: {
          ...state.lockedMods,
          [plugCategoryHash]: state.lockedMods[plugCategoryHash]?.filter(
            (locked) => locked.key !== action.mod.key
          ),
        },
      };
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
