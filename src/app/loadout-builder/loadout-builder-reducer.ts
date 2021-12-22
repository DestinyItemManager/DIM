import {
  defaultLoadoutParameters,
  LoadoutParameters,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { emptyObject } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { useReducer } from 'react';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import {
  lockedModsFromLoadoutParameters,
  statFiltersFromLoadoutParamaters,
  statOrderFromLoadoutParameters,
} from './loadout-params';
import { ArmorSet, ArmorStatHashes, ExcludedItems, PinnedItems, StatFilters } from './types';

export interface LoadoutBuilderState {
  statOrder: ArmorStatHashes[]; // stat hashes, including disabled stats
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedMods: PluggableInventoryItemDefinition[];
  lockedExoticHash?: number;
  selectedStoreId?: string;
  statFilters: Readonly<StatFilters>;
  modPicker: {
    open: boolean;
    plugCategoryHashWhitelist?: number[];
  };
  compareSet?: ArmorSet;
}

function warnMissingClass(classType: DestinyClass, defs: D2ManifestDefinitions) {
  const missingClassName = Object.values(defs.Class).find((c) => c.classType === classType)!
    .displayProperties.name;

  showNotification({
    type: 'error',
    title: t('LoadoutBuilder.MissingClass', { className: missingClassName }),
    body: t('LoadoutBuilder.MissingClassDescription'),
  });
}

const lbStateInit = ({
  stores,
  preloadedLoadout,
  initialLoadoutParameters,
  classType,
  defs,
}: {
  stores: DimStore[];
  preloadedLoadout?: Loadout;
  initialLoadoutParameters: LoadoutParameters;
  classType: DestinyClass | undefined;
  defs: D2ManifestDefinitions;
}): LoadoutBuilderState => {
  const pinnedItems: PinnedItems = {};

  const matchingClass =
    classType !== undefined ? stores.find((store) => store.classType === classType) : undefined;

  if (classType !== undefined && !matchingClass) {
    warnMissingClass(classType, defs);
    // Take out the exotic
    initialLoadoutParameters = { ...initialLoadoutParameters, exoticArmorHash: undefined };
  }

  let selectedStoreId = (matchingClass ?? getCurrentStore(stores)!).id;

  let loadoutParams = initialLoadoutParameters;

  if (stores.length && preloadedLoadout) {
    let loadoutStore = getCurrentStore(stores);
    if (preloadedLoadout.classType === DestinyClass.Unknown) {
      const includedClasses = new Set(
        preloadedLoadout.items
          .map((i) => defs.InventoryItem.get(i.hash).classType)
          .filter((c) => c !== DestinyClass.Unknown)
      );
      if (includedClasses.size === 1) {
        const includedClassType = includedClasses.values().next().value;
        loadoutStore =
          stores.find((store) => store.classType === includedClassType) ?? loadoutStore;
      }
    } else {
      loadoutStore = stores.find((store) => store.classType === preloadedLoadout.classType);
    }

    if (!loadoutStore) {
      warnMissingClass(preloadedLoadout.classType, defs);
    } else {
      selectedStoreId = loadoutStore.id;
      // TODO: instead of locking items, show the loadout fixed at the top to compare against and leave all items free
      for (const loadoutItem of preloadedLoadout.items) {
        if (loadoutItem.equipped) {
          const item = getItemAcrossStores(stores, loadoutItem);
          if (item && isLoadoutBuilderItem(item)) {
            pinnedItems[item.bucket.hash] = item;
          }
        }
      }

      // Load all parameters from the loadout if we can
      if (preloadedLoadout.parameters) {
        loadoutParams = { ...defaultLoadoutParameters, ...preloadedLoadout.parameters };
      }
    }
  }

  const statOrder = statOrderFromLoadoutParameters(loadoutParams);
  const statFilters = statFiltersFromLoadoutParamaters(loadoutParams);
  const lockedMods = lockedModsFromLoadoutParameters(loadoutParams, defs);
  const lockItemEnergyType = Boolean(loadoutParams?.lockItemEnergyType);
  // We need to handle the deprecated case
  const upgradeSpendTier =
    loadoutParams.upgradeSpendTier === UpgradeSpendTier.AscendantShardsLockEnergyType
      ? UpgradeSpendTier.Nothing
      : loadoutParams.upgradeSpendTier!;
  const lockedExoticHash = loadoutParams.exoticArmorHash;

  return {
    lockItemEnergyType,
    upgradeSpendTier,
    statOrder,
    pinnedItems,
    excludedItems: emptyObject(),
    statFilters,
    lockedMods,
    lockedExoticHash,
    selectedStoreId,
    modPicker: {
      open: false,
    },
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderState['statFilters'] }
  | { type: 'sortOrderChanged'; sortOrder: LoadoutBuilderState['statOrder'] }
  | {
      type: 'lockItemEnergyTypeChanged';
      lockItemEnergyType: LoadoutBuilderState['lockItemEnergyType'];
    }
  | { type: 'upgradeSpendTierChanged'; upgradeSpendTier: LoadoutBuilderState['upgradeSpendTier'] }
  | { type: 'pinItem'; item: DimItem }
  | { type: 'setPinnedItems'; items: DimItem[] }
  | { type: 'unpinItem'; item: DimItem }
  | { type: 'excludeItem'; item: DimItem }
  | { type: 'unexcludeItem'; item: DimItem }
  | {
      type: 'lockedModsChanged';
      lockedMods: PluggableInventoryItemDefinition[];
    }
  | { type: 'removeLockedMod'; mod: PluggableInventoryItemDefinition }
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'lockExotic'; lockedExoticHash: number }
  | { type: 'removeLockedExotic' }
  | { type: 'openModPicker'; plugCategoryHashWhitelist?: number[] }
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
        pinnedItems: {},
        excludedItems: {},
        lockedExoticHash: undefined,
      };
    case 'statFiltersChanged':
      return { ...state, statFilters: action.statFilters };
    case 'pinItem': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        // Remove any previously locked item in that bucket and add this one
        pinnedItems: {
          ...state.pinnedItems,
          [bucketHash]: item,
        },
        // Locking an item clears excluded items in this bucket
        excludedItems: {
          ...state.excludedItems,
          [bucketHash]: undefined,
        },
      };
    }
    case 'setPinnedItems': {
      const { items } = action;
      return {
        ...state,
        pinnedItems: _.keyBy(items, (i) => i.bucket.hash),
        excludedItems: {},
      };
    }
    case 'unpinItem': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        pinnedItems: {
          ...state.pinnedItems,
          [bucketHash]: undefined,
        },
      };
    }
    case 'excludeItem': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      if (state.excludedItems[bucketHash]?.some((i) => i.id === item.id)) {
        return state; // item's already there
      }
      const existingExcluded = state.excludedItems[bucketHash] ?? [];
      return {
        ...state,
        excludedItems: {
          ...state.excludedItems,
          [bucketHash]: [...existingExcluded, item],
        },
      };
    }
    case 'unexcludeItem': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      const newExcluded = (state.excludedItems[bucketHash] ?? []).filter((i) => i.id !== item.id);
      return {
        ...state,
        excludedItems: {
          ...state.excludedItems,
          [bucketHash]: newExcluded.length > 0 ? newExcluded : undefined,
        },
      };
    }
    case 'lockedModsChanged': {
      return {
        ...state,
        lockedMods: action.lockedMods,
      };
    }
    case 'sortOrderChanged': {
      return {
        ...state,
        statOrder: action.sortOrder,
      };
    }
    case 'lockItemEnergyTypeChanged': {
      return {
        ...state,
        lockItemEnergyType: action.lockItemEnergyType,
      };
    }
    case 'upgradeSpendTierChanged': {
      return {
        ...state,
        upgradeSpendTier: action.upgradeSpendTier,
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
          plugCategoryHashWhitelist: action.plugCategoryHashWhitelist,
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

export function useLbState(
  stores: DimStore[],
  preloadedLoadout: Loadout | undefined,
  classType: DestinyClass | undefined,
  initialLoadoutParameters: LoadoutParameters,
  defs: D2ManifestDefinitions
) {
  return useReducer(
    lbStateReducer,
    { stores, preloadedLoadout, initialLoadoutParameters, defs, classType },
    lbStateInit
  );
}
