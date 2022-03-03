import {
  AssumeArmorMasterwork,
  defaultLoadoutParameters,
  LoadoutParameters,
  LockArmorEnergyType,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { DimLoadoutItem, Loadout } from 'app/loadout/loadout-types';
import {
  createSubclassDefaultSocketOverrides,
  findItemForLoadout,
} from 'app/loadout/loadout-utils';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { emptyObject } from 'app/utils/empty';
import { getSocketsByCategoryHashes } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useReducer } from 'react';
import { statFiltersFromLoadoutParamaters, statOrderFromLoadoutParameters } from './loadout-params';
import {
  ArmorSet,
  ArmorStatHashes,
  ExcludedItems,
  LockableBucketHashes,
  PinnedItems,
  StatFilters,
} from './types';

export interface LoadoutBuilderState {
  loadoutParameters: LoadoutParameters;
  // TODO: also fold statOrder, statFilters into loadoutParameters
  statOrder: ArmorStatHashes[]; // stat hashes, including disabled stats
  statFilters: Readonly<StatFilters>;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  selectedStoreId?: string;
  subclass?: DimLoadoutItem;
  modPicker: {
    open: boolean;
    plugCategoryHashWhitelist?: number[];
  };
  compareSet?: ArmorSet;
}

export function warnMissingClass(classType: DestinyClass, defs: D2ManifestDefinitions) {
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
  let subclass: DimLoadoutItem | undefined;

  if (stores.length && preloadedLoadout) {
    let loadoutStore = getCurrentStore(stores);
    if (preloadedLoadout.classType === DestinyClass.Unknown) {
      const includedClasses = new Set(
        preloadedLoadout.items
          .map((i) => defs.InventoryItem.get(i.hash)?.classType)
          .filter((c) => c !== undefined && c !== DestinyClass.Unknown)
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
        if (loadoutItem.equip) {
          const allItems = stores.flatMap((s) => s.items);
          const item = findItemForLoadout(defs, allItems, selectedStoreId, loadoutItem);
          if (item && isLoadoutBuilderItem(item)) {
            pinnedItems[item.bucket.hash] = item;
          } else if (item && item.bucket.hash === BucketHashes.Subclass && item.sockets) {
            // In LO we populate the default ability plugs because in game you cannot unselect all abilities.
            const socketOverridesForLO = {
              ...createSubclassDefaultSocketOverrides(item),
              ...loadoutItem.socketOverrides,
            };

            subclass = { ...item, socketOverrides: socketOverridesForLO };
          }
        }
      }

      // Load all parameters from the loadout if we can
      if (preloadedLoadout.parameters) {
        loadoutParams = { ...defaultLoadoutParameters, ...preloadedLoadout.parameters };
      }

      if (!loadoutParams.exoticArmorHash) {
        const equippedExotic = preloadedLoadout.items
          .filter((li) => li.equip)
          .map((li) => defs.InventoryItem.get(li.hash))
          .find(
            (i) =>
              Boolean(i?.equippingBlock?.uniqueLabel) &&
              LockableBucketHashes.includes(i.inventory?.bucketTypeHash ?? 0)
          );

        if (equippedExotic) {
          loadoutParams = { ...loadoutParams, exoticArmorHash: equippedExotic.hash };
        }
      }
    }
  }

  const statOrder = statOrderFromLoadoutParameters(loadoutParams);
  const statFilters = statFiltersFromLoadoutParamaters(loadoutParams);

  return {
    loadoutParameters: loadoutParams,
    statOrder,
    pinnedItems,
    excludedItems: emptyObject(),
    statFilters,
    subclass,
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
      type: 'assumeArmorMasterworkChanged';
      assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
    }
  | { type: 'lockArmorEnergyTypeChanged'; lockArmorEnergyType: LockArmorEnergyType | undefined }
  | { type: 'pinItem'; item: DimItem }
  | { type: 'setPinnedItems'; items: DimItem[] }
  | { type: 'unpinItem'; item: DimItem }
  | { type: 'excludeItem'; item: DimItem }
  | { type: 'unexcludeItem'; item: DimItem }
  | { type: 'lockedModsChanged'; lockedMods: PluggableInventoryItemDefinition[] }
  | { type: 'removeLockedMod'; mod: PluggableInventoryItemDefinition }
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'updateSubclass'; item: DimItem }
  | { type: 'removeSubclass' }
  | { type: 'updateSubclassSocketOverrides'; socketOverrides: { [socketIndex: number]: number } }
  | { type: 'removeSingleSubclassSocketOverride'; plug: PluggableInventoryItemDefinition }
  | { type: 'lockExotic'; lockedExoticHash: number }
  | { type: 'removeLockedExotic' }
  | { type: 'openModPicker'; plugCategoryHashWhitelist?: number[] }
  | { type: 'closeModPicker' }
  | { type: 'openCompareDrawer'; set: ArmorSet }
  | { type: 'closeCompareDrawer' };

// TODO: Move more logic inside the reducer
function lbStateReducer(defs: D2ManifestDefinitions) {
  return (state: LoadoutBuilderState, action: LoadoutBuilderAction): LoadoutBuilderState => {
    switch (action.type) {
      case 'changeCharacter':
        return {
          ...state,
          selectedStoreId: action.storeId,
          pinnedItems: {},
          excludedItems: {},
          loadoutParameters: {
            ...state.loadoutParameters,
            exoticArmorHash: undefined,
          },
          subclass: undefined,
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
          // Also unpin items in this bucket
          pinnedItems: {
            ...state.pinnedItems,
            [bucketHash]: undefined,
          },
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
          loadoutParameters: {
            ...state.loadoutParameters,
            mods: action.lockedMods.map((m) => m.hash),
          },
        };
      }
      case 'sortOrderChanged': {
        return {
          ...state,
          statOrder: action.sortOrder,
        };
      }
      case 'assumeArmorMasterworkChanged': {
        const { assumeArmorMasterwork } = action;
        return {
          ...state,
          loadoutParameters: { ...state.loadoutParameters, assumeArmorMasterwork },
        };
      }
      case 'lockArmorEnergyTypeChanged': {
        const { lockArmorEnergyType } = action;
        return {
          ...state,
          loadoutParameters: { ...state.loadoutParameters, lockArmorEnergyType },
        };
      }
      case 'addGeneralMods': {
        const newMods = [...(state.loadoutParameters.mods ?? [])];
        let currentGeneralModsCount =
          newMods.filter(
            (mod) =>
              defs.InventoryItem.get(mod)?.plug?.plugCategoryHash ===
              armor2PlugCategoryHashesByName.general
          ).length ?? 0;

        const failures: string[] = [];

        for (const mod of action.mods) {
          if (currentGeneralModsCount < 5) {
            newMods.push(mod.hash);
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
          loadoutParameters: {
            ...state.loadoutParameters,
            mods: newMods,
          },
        };
      }
      case 'removeLockedMod': {
        const newMods = [...(state.loadoutParameters.mods ?? [])];
        const indexToRemove = newMods.findIndex((mod) => mod === action.mod.hash);
        if (indexToRemove >= 0) {
          newMods.splice(indexToRemove, 1);
        }

        return {
          ...state,
          loadoutParameters: {
            ...state.loadoutParameters,
            mods: newMods,
          },
        };
      }
      case 'updateSubclass': {
        const { item } = action;

        return {
          ...state,
          subclass: { ...item, socketOverrides: createSubclassDefaultSocketOverrides(item) },
        };
      }
      case 'removeSubclass': {
        return { ...state, subclass: undefined };
      }
      case 'updateSubclassSocketOverrides': {
        if (!state.subclass) {
          return state;
        }

        const { socketOverrides } = action;
        return { ...state, subclass: { ...state.subclass, socketOverrides } };
      }
      case 'removeSingleSubclassSocketOverride': {
        if (!state.subclass) {
          return state;
        }

        const { plug } = action;
        const abilityAndSuperSockets = getSocketsByCategoryHashes(state.subclass.sockets, [
          SocketCategoryHashes.Abilities_Abilities_DarkSubclass,
          SocketCategoryHashes.Abilities_Abilities_LightSubclass,
          SocketCategoryHashes.Super,
        ]);
        const newSocketOverrides = { ...state.subclass?.socketOverrides };
        let socketIndexToRemove: number | undefined;

        // Find the socket index to remove the plug from.
        for (const socketIndexString of Object.keys(newSocketOverrides)) {
          const socketIndex = parseInt(socketIndexString, 10);
          const overridePlugHash = newSocketOverrides[socketIndex];
          if (overridePlugHash === plug.hash) {
            socketIndexToRemove = socketIndex;
            break;
          }
        }

        // If we are removing from an ability/super socket, find the socket so we can
        // show the default plug instead
        const abilitySocketRemovingFrom = abilityAndSuperSockets.find(
          (socket) => socket.socketIndex === socketIndexToRemove
        );

        if (socketIndexToRemove !== undefined && abilitySocketRemovingFrom) {
          // If this is an ability socket, replace with the default plug hash
          newSocketOverrides[socketIndexToRemove] =
            abilitySocketRemovingFrom.socketDefinition.singleInitialItemHash;
        } else if (socketIndexToRemove) {
          // If its not an ability we just remove it from the overrides
          delete newSocketOverrides[socketIndexToRemove];
        }
        return {
          ...state,
          subclass: {
            ...state.subclass,
            socketOverrides: Object.keys(newSocketOverrides).length
              ? newSocketOverrides
              : undefined,
          },
        };
      }
      case 'lockExotic': {
        const { lockedExoticHash } = action;
        return {
          ...state,
          loadoutParameters: {
            ...state.loadoutParameters,
            exoticArmorHash: lockedExoticHash,
          },
        };
      }
      case 'removeLockedExotic': {
        return {
          ...state,
          loadoutParameters: {
            ...state.loadoutParameters,
            exoticArmorHash: undefined,
          },
        };
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
  };
}

export function useLbState(
  stores: DimStore[],
  preloadedLoadout: Loadout | undefined,
  classType: DestinyClass | undefined,
  initialLoadoutParameters: LoadoutParameters,
  defs: D2ManifestDefinitions
) {
  return useReducer(
    lbStateReducer(defs),
    { stores, preloadedLoadout, initialLoadoutParameters, defs, classType },
    lbStateInit
  );
}
