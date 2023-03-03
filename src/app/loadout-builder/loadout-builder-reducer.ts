import {
  AssumeArmorMasterwork,
  defaultLoadoutParameters,
  LoadoutParameters,
  StatConstraint,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  savedLoadoutParametersSelector,
  savedLoStatConstraintsByClassSelector,
} from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import {
  createSubclassDefaultSocketOverrides,
  findItemForLoadout,
  pickBackingStore,
} from 'app/loadout-drawer/loadout-utils';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { mapToNonReducedModCostVariant } from 'app/loadout/mod-utils';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { emptyObject } from 'app/utils/empty';
import {
  getDefaultAbilityChoiceHash,
  getSocketsByCategoryHashes,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import { useHistory } from 'app/utils/undo-redo-history';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { statFiltersFromLoadoutParamaters, statOrderFromLoadoutParameters } from './loadout-params';
import {
  ArmorSet,
  ArmorStatHashes,
  ExcludedItems,
  LockableBucketHashes,
  PinnedItems,
  StatFilters,
} from './types';

interface LoadoutBuilderUI {
  modPicker: {
    open: boolean;
    plugCategoryHashWhitelist?: number[];
  };
  compareSet?: ArmorSet;
}

interface LoadoutBuilderConfiguration {
  loadoutParameters: LoadoutParameters;
  // TODO: also fold statOrder, statFilters into loadoutParameters
  statOrder: ArmorStatHashes[]; // stat hashes, including disabled stats
  statFilters: Readonly<StatFilters>;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  selectedStoreId?: string;
  subclass?: ResolvedLoadoutItem;
}

export type LoadoutBuilderState = LoadoutBuilderUI & LoadoutBuilderConfiguration;

export function warnMissingClass(classType: DestinyClass, defs: D2ManifestDefinitions) {
  const missingClassName = Object.values(defs.Class).find((c) => c.classType === classType)!
    .displayProperties.name;

  showNotification({
    type: 'error',
    title: t('LoadoutBuilder.MissingClass', { className: missingClassName }),
    body: t('LoadoutBuilder.MissingClassDescription'),
  });
}

const lbConfigInit = ({
  stores,
  defs,
  preloadedLoadout,
  initialClassType,
  initialLoadoutParameters,
  savedLoadoutBuilderParameters,
  savedStatConstraintsPerClass,
}: {
  stores: DimStore[];
  defs: D2ManifestDefinitions;
  preloadedLoadout: Loadout | undefined;
  initialClassType: DestinyClass | undefined;
  initialLoadoutParameters: LoadoutParameters | undefined;
  savedLoadoutBuilderParameters: LoadoutParameters;
  savedStatConstraintsPerClass: { [classType: number]: StatConstraint[] };
}): LoadoutBuilderConfiguration => {
  const pinnedItems: PinnedItems = {};

  // Preloaded loadouts from the "Optimize Armor" button take priority
  let classType: DestinyClass = initialClassType ?? DestinyClass.Unknown;
  // Pick a store that matches the classType
  const storeMatchingClass = pickBackingStore(stores, undefined, classType);

  // If we requested a specific class type but the user doesn't have it, we
  // need to pick some different store, but ensure that class-specific stuff
  // doesn't end up in LO parameters.
  if (!storeMatchingClass && classType !== DestinyClass.Unknown) {
    warnMissingClass(classType, defs);
    initialLoadoutParameters = { ...initialLoadoutParameters, exoticArmorHash: undefined };
    // ensure we don't start a LO session with items for a totally different class type
    preloadedLoadout = undefined;
  }

  // Fall back to the current store if we didn't find a store matching our class
  const selectedStore = storeMatchingClass ?? getCurrentStore(stores)!;
  const selectedStoreId = selectedStore.id;
  classType = selectedStore.classType;

  // In order of increasing priority:
  // default parameters, global saved parameters, stat order for this class,
  // things that came from the loadout share or preloaded loadout
  let loadoutParameters = { ...defaultLoadoutParameters, ...savedLoadoutBuilderParameters };
  const thisClassStatConstraints = savedStatConstraintsPerClass[classType];
  if (thisClassStatConstraints) {
    loadoutParameters.statConstraints = thisClassStatConstraints;
  }
  loadoutParameters = { ...loadoutParameters, ...initialLoadoutParameters };

  let subclass: ResolvedLoadoutItem | undefined;

  // Loadouts only support items that are supported by the Loadout's class
  if (preloadedLoadout) {
    // TODO: instead of locking items, show the loadout fixed at the top to compare against and leave all items free
    for (const loadoutItem of preloadedLoadout.items) {
      if (loadoutItem.equip) {
        const allItems = stores.flatMap((s) => s.items);
        const item = findItemForLoadout(defs, allItems, selectedStoreId, loadoutItem);
        if (item && isLoadoutBuilderItem(item)) {
          pinnedItems[item.bucket.hash] = item;
        } else if (item?.bucket.hash === BucketHashes.Subclass && item.sockets) {
          // In LO we populate the default ability plugs because in game you cannot unselect all abilities.
          const socketOverridesForLO = {
            ...createSubclassDefaultSocketOverrides(item),
            ...loadoutItem.socketOverrides,
          };

          subclass = {
            item,
            loadoutItem: { ...loadoutItem, socketOverrides: socketOverridesForLO },
          };
        }
      }
    }

    if (!loadoutParameters.exoticArmorHash) {
      const equippedExotic = preloadedLoadout.items
        .filter((li) => li.equip)
        .map((li) => defs.InventoryItem.get(li.hash))
        .find(
          (i) =>
            Boolean(i?.equippingBlock?.uniqueLabel) &&
            LockableBucketHashes.includes(i.inventory?.bucketTypeHash ?? 0)
        );

      if (equippedExotic) {
        loadoutParameters = { ...loadoutParameters, exoticArmorHash: equippedExotic.hash };
      }
    }
  }

  const statOrder = statOrderFromLoadoutParameters(loadoutParameters);
  const statFilters = statFiltersFromLoadoutParamaters(loadoutParameters);

  // FIXME: Always require turning on auto mods explicitly for now...
  loadoutParameters = { ...loadoutParameters, autoStatMods: undefined };
  // Also delete artifice mods -- artifice mods are always picked automatically per set.
  if (loadoutParameters.mods) {
    loadoutParameters.mods = loadoutParameters.mods.filter((modHash) => {
      const def = defs.InventoryItem.get(modHash);
      return (
        !def ||
        !isPluggableItem(def) ||
        def.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsArtifice
      );
    });
  }
  delete loadoutParameters.lockArmorEnergyType;

  return {
    loadoutParameters,
    statOrder,
    pinnedItems,
    excludedItems: emptyObject(),
    statFilters,
    subclass,
    selectedStoreId,
  };
};

type LoadoutBuilderConfigAction =
  | {
      type: 'changeCharacter';
      store: DimStore;
      savedStatConstraintsByClass: { [classType: number]: StatConstraint[] };
    }
  | { type: 'statFiltersChanged'; statFilters: LoadoutBuilderConfiguration['statFilters'] }
  | { type: 'sortOrderChanged'; sortOrder: LoadoutBuilderConfiguration['statOrder'] }
  | {
      type: 'assumeArmorMasterworkChanged';
      assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
    }
  | { type: 'pinItem'; item: DimItem }
  | { type: 'setPinnedItems'; items: DimItem[] }
  | { type: 'unpinItem'; item: DimItem }
  | { type: 'excludeItem'; item: DimItem }
  | { type: 'unexcludeItem'; item: DimItem }
  | { type: 'autoStatModsChanged'; autoStatMods: boolean }
  | { type: 'lockedModsChanged'; lockedMods: PluggableInventoryItemDefinition[] }
  | { type: 'removeLockedMod'; mod: PluggableInventoryItemDefinition }
  | { type: 'removeLockedMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'updateSubclass'; item: DimItem }
  | { type: 'removeSubclass' }
  | { type: 'updateSubclassSocketOverrides'; socketOverrides: { [socketIndex: number]: number } }
  | { type: 'removeSingleSubclassSocketOverride'; plug: PluggableInventoryItemDefinition }
  | { type: 'lockExotic'; lockedExoticHash: number }
  | { type: 'removeLockedExotic' };

type LoadoutBuilderUIAction =
  | { type: 'openModPicker'; plugCategoryHashWhitelist?: number[] }
  | { type: 'closeModPicker' }
  | { type: 'openCompareDrawer'; set: ArmorSet }
  | { type: 'closeCompareDrawer' };

export type LoadoutBuilderAction =
  | LoadoutBuilderConfigAction
  | LoadoutBuilderUIAction
  | { type: 'undo' }
  | { type: 'redo' };

function lbUIReducer(state: LoadoutBuilderUI, action: LoadoutBuilderUIAction) {
  switch (action.type) {
    case 'openCompareDrawer':
      return { ...state, compareSet: action.set };
    case 'openModPicker':
      return {
        ...state,
        modPicker: {
          open: true,
          plugCategoryHashWhitelist: action.plugCategoryHashWhitelist,
        },
      };
    case 'closeCompareDrawer':
      return { ...state, compareSet: undefined };
    case 'closeModPicker':
      return { ...state, modPicker: { open: false } };
  }
}

// TODO: Move more logic inside the reducer
function lbConfigReducer(defs: D2ManifestDefinitions) {
  return (
    state: LoadoutBuilderConfiguration,
    action: LoadoutBuilderConfigAction
  ): LoadoutBuilderConfiguration => {
    switch (action.type) {
      case 'changeCharacter': {
        let loadoutParameters = {
          ...state.loadoutParameters,
          exoticArmorHash: undefined,
        };

        const constraints = action.savedStatConstraintsByClass[action.store.classType];
        if (constraints) {
          loadoutParameters = { ...loadoutParameters, statConstraints: constraints };
        }
        return {
          ...state,
          selectedStoreId: action.store.id,
          pinnedItems: {},
          excludedItems: {},
          loadoutParameters,
          statOrder: statOrderFromLoadoutParameters(loadoutParameters),
          statFilters: statFiltersFromLoadoutParamaters(loadoutParameters),
          subclass: undefined,
        };
      }
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
            mods: action.lockedMods.map((m) => m.hash).map(mapToNonReducedModCostVariant),
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
      case 'removeLockedMods': {
        const newMods = [...(state.loadoutParameters.mods ?? [])].filter(
          (mod) => !action.mods.some((excludedMod) => excludedMod.hash === mod)
        );

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
          subclass: {
            item,
            loadoutItem: {
              id: item.id,
              hash: item.hash,
              equip: true,
              amount: 1,
              socketOverrides: createSubclassDefaultSocketOverrides(item),
            },
          },
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
        return {
          ...state,
          subclass: {
            ...state.subclass,
            loadoutItem: { ...state.subclass.loadoutItem, socketOverrides },
          },
        };
      }
      case 'removeSingleSubclassSocketOverride': {
        if (!state.subclass) {
          return state;
        }

        const { plug } = action;
        const abilityAndSuperSockets = getSocketsByCategoryHashes(
          state.subclass.item.sockets,
          subclassAbilitySocketCategoryHashes
        );
        const newSocketOverrides = { ...state.subclass?.loadoutItem.socketOverrides };
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
            getDefaultAbilityChoiceHash(abilitySocketRemovingFrom);
        } else if (socketIndexToRemove) {
          // If its not an ability we just remove it from the overrides
          delete newSocketOverrides[socketIndexToRemove];
        }
        return {
          ...state,
          subclass: {
            ...state.subclass,
            loadoutItem: {
              ...state.subclass.loadoutItem,
              socketOverrides: Object.keys(newSocketOverrides).length
                ? newSocketOverrides
                : undefined,
            },
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
      case 'autoStatModsChanged':
        return {
          ...state,
          loadoutParameters: {
            ...state.loadoutParameters,
            autoStatMods: action.autoStatMods,
          },
        };
    }
  };
}

export function useLbState(
  stores: DimStore[],
  defs: D2ManifestDefinitions,
  preloadedLoadout: Loadout | undefined,
  initialClassType: DestinyClass | undefined,
  initialLoadoutParameters: LoadoutParameters | undefined
) {
  const savedLoadoutBuilderParameters = useSelector(savedLoadoutParametersSelector);
  const savedStatConstraintsPerClass = useSelector(savedLoStatConstraintsByClassSelector);

  const {
    state: lbConfState,
    setState,
    redo,
    undo,
    canRedo,
    canUndo,
  } = useHistory(
    lbConfigInit({
      stores,
      defs,
      preloadedLoadout,
      initialClassType,
      initialLoadoutParameters,
      savedLoadoutBuilderParameters,
      savedStatConstraintsPerClass,
    })
  );

  const lbConfReducer = useMemo(() => lbConfigReducer(defs), [defs]);

  const [lbUIState, lbUIDispatch] = useReducer(lbUIReducer, {
    compareSet: undefined,
    modPicker: { open: false },
  });

  const dispatch = useCallback(
    (action: LoadoutBuilderAction) => {
      switch (action.type) {
        case 'undo':
          undo();
          lbUIDispatch({ type: 'closeCompareDrawer' });
          lbUIDispatch({ type: 'closeModPicker' });
          break;
        case 'redo':
          redo();
          lbUIDispatch({ type: 'closeCompareDrawer' });
          lbUIDispatch({ type: 'closeModPicker' });
          break;
        case 'openCompareDrawer':
        case 'closeCompareDrawer':
        case 'openModPicker':
        case 'closeModPicker':
          lbUIDispatch(action);
          break;
        default:
          setState((oldState) => lbConfReducer(oldState, action));
          break;
      }
    },
    [lbConfReducer, redo, setState, undo]
  );

  return [
    {
      ...lbConfState,
      ...lbUIState,
      canUndo,
      canRedo,
    },
    dispatch,
  ] as const;
}
