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
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import {
  addItem,
  applySocketOverrides,
  clearSubclass,
  removeMod,
  setLoadoutParameters,
  updateMods,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, ResolvedLoadoutItem, ResolvedLoadoutMod } from 'app/loadout-drawer/loadout-types';
import { findItemForLoadout, newLoadout, pickBackingStore } from 'app/loadout-drawer/loadout-utils';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { emptyObject } from 'app/utils/empty';
import { errorLog } from 'app/utils/log';
import {
  getSocketsByCategoryHashes,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import { useHistory } from 'app/utils/undo-redo-history';
import { reorder } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { resolveStatConstraints, unresolveStatConstraints } from './loadout-params';
import {
  ArmorSet,
  ExcludedItems,
  LockableBucketHashes,
  PinnedItems,
  ResolvedStatConstraint,
} from './types';

interface LoadoutBuilderUI {
  modPicker: {
    open: boolean;
    plugCategoryHashWhitelist?: number[];
  };
  compareSet?: ArmorSet;
}

interface LoadoutBuilderConfiguration {
  /**
   * The store we're operating on. We do this instead of just a class because
   * different characters of the same class may have different mods or vendor
   * items unlocked.
   */
  selectedStoreId: string;
  /**
   * The loadout we're optimizing. Either a brand new loadout (starting from
   * saved preferences) or an existing loadout where we're trying to improve its
   * stats.
   */
  loadout: Loadout;
  /**
   * Are we editing an existing loadout, or a new one? The loadout may never
   * have been saved (e.g. coming from a loadout share) but this still
   * distinguishes between "clean slate" and when we started with a loadout.
   */
  existingLoadout: boolean;

  /**
   * A copy of `loadout.parameters.statConstraints`, but with ignored stats
   * included. This is more convenient to use than the raw `statConstraints` but
   * is kept in sync. Like `statConstraints` this is always in stat preference
   * order.
   */
  resolvedStatConstraints: ResolvedStatConstraint[];

  // TODO: While I can think of reasons to have them, I don't love the complex
  // interaction of selecting individual pinned/excluded items. Maybe instead
  // rely on search (e.g. -is:inloadout) and otherwise let LO choose via mods.
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;

  // TODO: When we are starting with an existing loadout, maybe have a new sort
  // of "locked" state where we only show sets that improve upon the loadout's
  // existing stat tiers (still obeying the stat filters)?
  // e.g. setTierFilter: 'all' | 'betterInAllStats' | 'betterInTotalTier' (as an enum...)
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

/**
 * Create the initial state object for the loadout optimizer.
 */
const lbConfigInit = ({
  stores,
  allItems,
  defs,
  preloadedLoadout,
  storeId,
  savedLoadoutBuilderParameters,
  savedStatConstraintsPerClass,
}: {
  stores: DimStore[];
  allItems: DimItem[];
  defs: D2ManifestDefinitions;
  /**
   * A loadout that we are starting with, from the Loadouts page or editor.
   * This can be null to start with a brand new loadout.
   */
  // TODO: Maybe always provide an initial loadout.
  preloadedLoadout: Loadout | undefined;
  storeId: string | undefined;
  savedLoadoutBuilderParameters: LoadoutParameters;
  savedStatConstraintsPerClass: { [classType: number]: StatConstraint[] };
}): LoadoutBuilderConfiguration => {
  // Preloaded loadouts from the "Optimize Armor" button take priority
  const classTypeFromPreloadedLoadout = preloadedLoadout?.classType ?? DestinyClass.Unknown;
  // Pick a store that matches the given store ID, or fall back to the loadout's classType
  const storeMatchingClass = pickBackingStore(stores, storeId, classTypeFromPreloadedLoadout);
  const initialLoadoutParameters = preloadedLoadout?.parameters;

  const existingLoadout = Boolean(preloadedLoadout);

  // If we requested a specific class type but the user doesn't have it, we
  // need to pick some different store, but ensure that class-specific stuff
  // doesn't end up in LO parameters.
  if (!storeMatchingClass && classTypeFromPreloadedLoadout !== DestinyClass.Unknown) {
    // This can't actually happen anymore since we won't open a loadout share at
    // all if we don't have that class
    warnMissingClass(classTypeFromPreloadedLoadout, defs);
    preloadedLoadout = undefined;
  }

  // Fall back to the current store if we didn't find a store matching our class
  const selectedStore = storeMatchingClass ?? getCurrentStore(stores)!;
  const selectedStoreId = selectedStore.id;
  const classType = selectedStore.classType;
  let loadout = preloadedLoadout ?? newLoadout(t('LoadoutBuilder.LoadoutName'), [], classType);

  // In order of increasing priority:
  // default parameters, global saved parameters, stat order for this class,
  // things that came from the loadout share or preloaded loadout
  let loadoutParameters = { ...defaultLoadoutParameters, ...savedLoadoutBuilderParameters };
  const thisClassStatConstraints = savedStatConstraintsPerClass[classType];
  if (thisClassStatConstraints) {
    loadoutParameters.statConstraints = thisClassStatConstraints;
  }
  loadoutParameters = { ...loadoutParameters, ...initialLoadoutParameters };

  const pinnedItems: PinnedItems = {};

  // Loadouts only support items that are supported by the Loadout's class
  if (preloadedLoadout) {
    // Pin all the items in the preloaded loadout
    // TODO: instead of pinning items, show the loadout fixed at the top to compare against and leave all items free
    for (const loadoutItem of preloadedLoadout.items) {
      if (loadoutItem.equip) {
        const item = findItemForLoadout(defs, allItems, selectedStoreId, loadoutItem);
        if (item && isLoadoutBuilderItem(item)) {
          pinnedItems[item.bucket.hash] = item;
        }
      }
    }

    // If we load a loadout with an exotic, pre-fill the exotic armor selection
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

  // Also delete artifice mods -- artifice mods are always picked automatically
  // per set. In contrast we remove stat mods dynamically depending on the auto
  // stat mods setting.
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

  loadout = { ...loadout, parameters: loadoutParameters };

  return {
    loadout,
    existingLoadout,
    resolvedStatConstraints: resolveStatConstraints(loadoutParameters.statConstraints!),
    pinnedItems,
    excludedItems: emptyObject(),
    selectedStoreId,
  };
};

type LoadoutBuilderConfigAction =
  | {
      type: 'changeCharacter';
      store: DimStore;
      savedStatConstraintsByClass: { [classType: number]: StatConstraint[] };
    }
  | { type: 'statConstraintChanged'; constraint: ResolvedStatConstraint }
  | { type: 'statOrderChanged'; sourceIndex: number; destinationIndex: number; statHash: number }
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
  | { type: 'lockedModsChanged'; lockedMods: number[] }
  | { type: 'removeLockedMod'; mod: ResolvedLoadoutMod }
  /** For adding "half tier mods" */
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'updateSubclass'; item: DimItem }
  | { type: 'removeSubclass' }
  | {
      type: 'updateSubclassSocketOverrides';
      socketOverrides: { [socketIndex: number]: number };
      subclass: ResolvedLoadoutItem;
    }
  | {
      type: 'removeSingleSubclassSocketOverride';
      plug: PluggableInventoryItemDefinition;
      subclass: ResolvedLoadoutItem;
    }
  | { type: 'lockExotic'; lockedExoticHash: number }
  | { type: 'removeLockedExotic' }
  | { type: 'setSearchQuery'; query: string };

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
        // Always remove the subclass
        let loadout = clearSubclass(defs)(state.loadout);

        // And the exotic
        let loadoutParameters = {
          ...state.loadout.parameters,
          exoticArmorHash: undefined,
        };

        // Apply stat constraint preferences
        const constraints = action.savedStatConstraintsByClass[action.store.classType];
        if (constraints) {
          loadoutParameters = { ...loadoutParameters, statConstraints: constraints };
        }

        loadout = setLoadoutParameters(loadoutParameters)(loadout);

        return {
          ...state,
          loadout,
          selectedStoreId: action.store.id,
          // Also clear out pinned/excluded items
          pinnedItems: {},
          excludedItems: {},
        };
      }
      case 'statConstraintChanged': {
        const { constraint } = action;
        const newStatConstraints = state.resolvedStatConstraints.map((c) =>
          c.statHash === constraint.statHash ? constraint : c
        );
        return updateStatConstraints(state, newStatConstraints);
      }
      case 'statOrderChanged': {
        const { sourceIndex, destinationIndex } = action;
        const newOrder = reorder(state.resolvedStatConstraints, sourceIndex, destinationIndex);
        return updateStatConstraints(state, newOrder);
      }
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
          // TODO: maybe have an updateLoadout method?
          loadout: updateMods(action.lockedMods)(state.loadout),
        };
      }
      case 'assumeArmorMasterworkChanged': {
        const { assumeArmorMasterwork } = action;
        return {
          ...state,
          loadout: setLoadoutParameters({ assumeArmorMasterwork })(state.loadout),
        };
      }
      case 'addGeneralMods': {
        const newMods = [...(state.loadout.parameters?.mods ?? [])];
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
          loadout: updateMods(newMods)(state.loadout),
        };
      }
      case 'removeLockedMod': {
        return {
          ...state,
          loadout: removeMod(action.mod)(state.loadout),
        };
      }
      case 'updateSubclass': {
        const { item } = action;

        return {
          ...state,
          loadout: addItem(defs, item)(state.loadout),
        };
      }
      case 'removeSubclass': {
        return { ...state, loadout: clearSubclass(defs)(state.loadout) };
      }
      case 'updateSubclassSocketOverrides': {
        const { socketOverrides, subclass } = action;
        return {
          ...state,
          loadout: applySocketOverrides(subclass, socketOverrides)(state.loadout),
        };
      }
      case 'removeSingleSubclassSocketOverride': {
        const { plug, subclass } = action;
        const abilityAndSuperSockets = getSocketsByCategoryHashes(
          subclass.item.sockets,
          subclassAbilitySocketCategoryHashes
        );
        const newSocketOverrides = { ...subclass?.loadoutItem.socketOverrides };
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

        const isAbilitySocket = abilityAndSuperSockets.find(
          (socket) => socket.socketIndex === socketIndexToRemove
        );

        if (isAbilitySocket) {
          errorLog('loadout builder', 'cannot remove ability');
          return state;
        }

        if (socketIndexToRemove !== undefined) {
          // If its not an ability we just remove it from the overrides
          delete newSocketOverrides[socketIndexToRemove];
        }
        return {
          ...state,
          loadout: applySocketOverrides(
            subclass,
            Object.keys(newSocketOverrides).length ? newSocketOverrides : undefined
          )(state.loadout),
        };
      }
      case 'lockExotic': {
        const { lockedExoticHash } = action;
        return {
          ...state,
          loadout: setLoadoutParameters({ exoticArmorHash: lockedExoticHash })(state.loadout),
        };
      }
      case 'removeLockedExotic': {
        return {
          ...state,
          loadout: setLoadoutParameters({ exoticArmorHash: undefined })(state.loadout),
        };
      }
      case 'autoStatModsChanged':
        return {
          ...state,
          loadout: setLoadoutParameters({ autoStatMods: action.autoStatMods })(state.loadout),
        };
      case 'setSearchQuery':
        return {
          ...state,
          loadout: setLoadoutParameters({ query: action.query || undefined })(state.loadout),
        };
    }
  };
}

function updateStatConstraints(
  state: LoadoutBuilderConfiguration,
  resolvedStatConstraints: ResolvedStatConstraint[]
): LoadoutBuilderConfiguration {
  return {
    ...state,
    resolvedStatConstraints,
    loadout: setLoadoutParameters({
      statConstraints: unresolveStatConstraints(resolvedStatConstraints),
    })(state.loadout),
  };
}

export function useLbState(
  stores: DimStore[],
  defs: D2ManifestDefinitions,
  preloadedLoadout: Loadout | undefined,
  storeId: string | undefined
) {
  const savedLoadoutBuilderParameters = useSelector(savedLoadoutParametersSelector);
  const savedStatConstraintsPerClass = useSelector(savedLoStatConstraintsByClassSelector);
  const allItems = useSelector(allItemsSelector);

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
      allItems,
      defs,
      preloadedLoadout,
      storeId,
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
