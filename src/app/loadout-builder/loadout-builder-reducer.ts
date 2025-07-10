import {
  AssumeArmorMasterwork,
  LoadoutParameters,
  StatConstraint,
  defaultLoadoutParameters,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  savedLoStatConstraintsByClassSelector,
  savedLoadoutParametersSelector,
} from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import {
  LoadoutUpdateFunction,
  clearSubclass,
  removeMod,
  setLoadoutParameters,
  updateMods,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { findItemForLoadout, newLoadout, pickBackingStore } from 'app/loadout-drawer/loadout-utils';
import { EFFECTIVE_MAX_STAT, MAX_STAT } from 'app/loadout/known-values';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { Loadout, ResolvedLoadoutMod } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName, armorStats } from 'app/search/d2-known-values';
import { count, reorder } from 'app/utils/collections';
import { emptyObject } from 'app/utils/empty';
import { useHistory } from 'app/utils/undo-redo-history';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { keyBy, shuffle } from 'es-toolkit';
import { useCallback, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { resolveStatConstraints, unresolveStatConstraints } from './loadout-params';
import {
  ArmorBucketHashes,
  ArmorSet,
  ExcludedItems,
  PinnedItems,
  ResolvedStatConstraint,
} from './types';

interface LoadoutBuilderUI {
  modPicker: {
    open: boolean;
    plugCategoryHashWhitelist?: number[];
  };
  compareSet?: {
    set: ArmorSet;
    /**
     * The items selected from the armor set's options to use. This isn't
     * always just the first option for each bucket.
     */
    items: DimItem[];
  };
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
   * If we are editing an existing loadout via the "better stats available"
   * feature, this contains the stats we actually need to exceed.
   */
  strictUpgradesStatConstraints: ResolvedStatConstraint[] | undefined;

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
  const missingClassName = Object.values(defs.Class.getAll()).find(
    (c) => c.classType === classType,
  )!.displayProperties.name;

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
  strictUpgradesStatConstraints,
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
  strictUpgradesStatConstraints: ResolvedStatConstraint[] | undefined;
}): LoadoutBuilderConfiguration => {
  // Preloaded loadouts from the "Optimize Armor" button take priority
  const classTypeFromPreloadedLoadout = preloadedLoadout?.classType ?? DestinyClass.Unknown;
  // Pick a store that matches the given store ID, or fall back to the loadout's classType
  const storeMatchingClass = pickBackingStore(stores, storeId, classTypeFromPreloadedLoadout);
  const initialLoadoutParameters = preloadedLoadout?.parameters;

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
  let loadout = preloadedLoadout ?? newLoadout('', [], classType);

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
      // TODO: maybe swap in the updated item ID for items here, to make future manipulation easier
    }

    // If we load a loadout with an exotic, pre-fill the exotic armor selection
    if (!loadoutParameters.exoticArmorHash) {
      const equippedExotic = preloadedLoadout.items
        .filter((li) => li.equip)
        .map((li) => defs.InventoryItem.get(li.hash))
        .find(
          (i) =>
            Boolean(i?.equippingBlock?.uniqueLabel) &&
            ArmorBucketHashes.includes(i.inventory?.bucketTypeHash ?? 0),
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
    loadoutParameters.mods = stripArtificeMods(defs, loadoutParameters.mods);
  }

  loadout = { ...loadout, parameters: loadoutParameters };

  return {
    loadout,
    resolvedStatConstraints: resolveStatConstraints(loadoutParameters.statConstraints!),
    strictUpgradesStatConstraints,
    pinnedItems,
    excludedItems: emptyObject(),
    selectedStoreId,
  };
};

/**
 * We never want to include artifice mods in the list of mods for a loadout
 * being edited by LO - they should be chosen by LO itself, and only re-added
 * when the loadout is saved.
 */
function stripArtificeMods(defs: D2ManifestDefinitions, mods: number[]) {
  return mods.filter((modHash) => {
    const def = defs.InventoryItem.get(modHash);
    return (
      !def ||
      !isPluggableItem(def) ||
      def.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsArtifice
    );
  });
}

type LoadoutBuilderConfigAction =
  | { type: 'setLoadout'; updateFn: LoadoutUpdateFunction }
  | {
      type: 'changeCharacter';
      store: DimStore;
      savedStatConstraintsByClass: { [classType: number]: StatConstraint[] };
    }
  | { type: 'statConstraintChanged'; constraint: ResolvedStatConstraint }
  | { type: 'statConstraintReset' }
  | { type: 'statConstraintRandomize' }
  | { type: 'setStatConstraints'; constraints: ResolvedStatConstraint[] }
  | { type: 'statOrderChanged'; sourceIndex: number; destinationIndex: number }
  | {
      type: 'assumeArmorMasterworkChanged';
      assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
    }
  | { type: 'pinItem'; item: DimItem }
  | { type: 'setPinnedItems'; items: DimItem[] }
  | { type: 'unpinItem'; item: DimItem }
  | { type: 'excludeItem'; item: DimItem }
  | { type: 'unexcludeItem'; item: DimItem }
  | { type: 'clearExcludedItems' }
  | { type: 'autoStatModsChanged'; autoStatMods: boolean }
  | { type: 'lockedModsChanged'; lockedMods: number[] }
  | { type: 'removeLockedMod'; mod: ResolvedLoadoutMod }
  /** For adding "half tier mods" */
  | { type: 'addGeneralMods'; mods: PluggableInventoryItemDefinition[] }
  | { type: 'lockExotic'; lockedExoticHash: number | undefined }
  | { type: 'removeLockedExotic' }
  | { type: 'dismissComparisonStats' }
  | { type: 'setSearchQuery'; query: string };

type LoadoutBuilderUIAction =
  | { type: 'openModPicker'; plugCategoryHashWhitelist?: number[] }
  | { type: 'closeModPicker' }
  | { type: 'openCompareDrawer'; set: ArmorSet; items: DimItem[] }
  | { type: 'closeCompareDrawer' };

export type LoadoutBuilderAction =
  | LoadoutBuilderConfigAction
  | LoadoutBuilderUIAction
  | { type: 'undo' }
  | { type: 'redo' };

function lbUIReducer(state: LoadoutBuilderUI, action: LoadoutBuilderUIAction) {
  switch (action.type) {
    case 'openCompareDrawer':
      return { ...state, compareSet: { set: action.set, items: action.items } };
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

function lbConfigReducer(defs: D2ManifestDefinitions) {
  return (
    state: LoadoutBuilderConfiguration,
    action: LoadoutBuilderConfigAction,
  ): LoadoutBuilderConfiguration => {
    switch (action.type) {
      case 'setLoadout': {
        return updateLoadout(state, (loadout) => {
          const updatedLoadout = action.updateFn(loadout);

          // Always check to make sure Artifice mods haven't snuck in - if they have, remove them
          const originalMods = updatedLoadout.parameters?.mods ?? [];
          const strippedMods = stripArtificeMods(defs, originalMods);
          if (strippedMods.length !== originalMods.length) {
            return updateMods(strippedMods)(updatedLoadout);
          }
          return updatedLoadout;
        });
      }
      case 'changeCharacter': {
        const { store } = action;
        const originalLoadout = state.loadout;
        let loadout: Loadout = { ...originalLoadout, classType: store.classType };

        // Always remove the subclass
        loadout = clearSubclass(defs)(loadout);

        // And the exotic
        let loadoutParameters = {
          ...loadout.parameters,
          exoticArmorHash: undefined,
        };

        // Apply stat constraint preferences
        const constraints = action.savedStatConstraintsByClass[store.classType];
        if (constraints) {
          loadoutParameters = { ...loadoutParameters, statConstraints: constraints };
        }

        loadout = setLoadoutParameters(loadoutParameters)(loadout);

        return {
          ...state,
          loadout,
          resolvedStatConstraints: resolveStatConstraints(loadoutParameters.statConstraints!),
          selectedStoreId: store.id,
          // Also clear out pinned/excluded items
          pinnedItems: {},
          excludedItems: {},
        };
      }
      case 'statConstraintChanged': {
        const { constraint } = action;
        const newStatConstraints = state.resolvedStatConstraints.map((c) =>
          c.statHash === constraint.statHash ? constraint : c,
        );
        return updateStatConstraints(state, newStatConstraints);
      }
      case 'statConstraintReset': {
        return updateStatConstraints(
          state,
          armorStats.map((s) => ({ statHash: s, minStat: 0, maxStat: MAX_STAT, ignored: false })),
        );
      }
      case 'statConstraintRandomize': {
        return updateStatConstraints(
          state,
          shuffle(
            armorStats.map((s) => ({
              statHash: s,
              minStat: Math.floor(Math.random() * EFFECTIVE_MAX_STAT),
              maxStat: MAX_STAT,
              ignored: false,
            })),
          ),
        );
      }
      case 'setStatConstraints': {
        const { constraints } = action;
        return updateStatConstraints(state, constraints);
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
          pinnedItems: keyBy(items, (i) => i.bucket.hash),
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
      case 'clearExcludedItems':
        return {
          ...state,
          excludedItems: {},
        };
      case 'lockedModsChanged':
        return updateLoadout(state, updateMods(action.lockedMods));
      case 'assumeArmorMasterworkChanged': {
        const { assumeArmorMasterwork } = action;
        return updateLoadout(state, setLoadoutParameters({ assumeArmorMasterwork }));
      }
      case 'addGeneralMods': {
        const newMods = [...(state.loadout.parameters?.mods ?? [])];
        let currentGeneralModsCount =
          count(
            newMods,
            (mod) =>
              defs.InventoryItem.get(mod)?.plug?.plugCategoryHash ===
              armor2PlugCategoryHashesByName.general,
          ) ?? 0;

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

        return updateLoadout(state, updateMods(newMods));
      }
      case 'removeLockedMod':
        return updateLoadout(state, removeMod(action.mod));
      case 'lockExotic': {
        const { lockedExoticHash } = action;
        return updateLoadout(state, setLoadoutParameters({ exoticArmorHash: lockedExoticHash }));
      }
      case 'removeLockedExotic':
        return updateLoadout(state, setLoadoutParameters({ exoticArmorHash: undefined }));
      case 'autoStatModsChanged':
        return updateLoadout(state, setLoadoutParameters({ autoStatMods: action.autoStatMods }));
      case 'dismissComparisonStats':
        return { ...state, strictUpgradesStatConstraints: undefined };
      case 'setSearchQuery':
        return updateLoadout(state, setLoadoutParameters({ query: action.query || undefined }));
    }
  };
}

function updateLoadout(state: LoadoutBuilderConfiguration, updateFn: LoadoutUpdateFunction) {
  return {
    ...state,
    loadout: updateFn(state.loadout),
  };
}

function updateStatConstraints(
  state: LoadoutBuilderConfiguration,
  resolvedStatConstraints: ResolvedStatConstraint[],
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
  storeId: string | undefined,
  strictUpgradesStatConstraints: ResolvedStatConstraint[] | undefined,
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
      strictUpgradesStatConstraints,
    }),
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
    [lbConfReducer, redo, setState, undo],
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
