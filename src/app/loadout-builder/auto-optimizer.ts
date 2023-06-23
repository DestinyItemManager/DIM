/**
 * The auto-optimizer takes existing saved loadouts and runs a special version
 * of Loadout Optimizer on them.
 */
import { AssumeArmorMasterwork, LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { savedLoadoutParametersSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import {
  createItemContextSelector,
  getTagSelector,
  storesSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import {
  getLoadoutStats,
  getModsFromLoadout,
  resolveLoadoutModHashes,
} from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useSavedLoadoutsForClassType } from 'app/loadout/loadout-ui/menu-hooks';
import { categorizeArmorMods, fitMostMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { MAX_ARMOR_ENERGY_CAPACITY, armorStats } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { filterFactorySelector, validateQuerySelector } from 'app/search/search-filter';
import { useSetting } from 'app/settings/hooks';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { infoLog } from 'app/utils/log';
import { currySelector } from 'app/utils/selector-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { proxy } from 'comlink';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useArmorItems } from './LoadoutBuilder';
import {
  AutoOptimizationParameters,
  AutoOptimizationReport,
  AutoOptimizationResult,
  LoadoutError,
} from './auto-optimizer-types';
import { filterItems } from './item-filter';
import { useLoVendorItems } from './loadout-builder-vendors';
import {
  statFiltersFromLoadoutParamaters as statFiltersFromLoadoutParameters,
  statOrderFromLoadoutParameters,
} from './loadout-params';
import { ProcessItemsByBucket } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapAutoMods } from './process/mappers';
import { createWorker, mapItemsToGroups, useAutoMods } from './process/useProcess';
import { statTier } from './stat-utils';
import {
  ArmorEnergyRules,
  ArmorStats,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LOCKED_EXOTIC_NO_EXOTIC,
  LockableBucketHash,
  MIN_LO_ITEM_ENERGY,
  loDefaultArmorEnergyRules,
} from './types';

interface AutoOptimizationContext {
  itemCreationContext: ItemCreationContext;
  unlockedPlugs: Set<number>;
  classType: DestinyClass;
  store: DimStore;
  savedLoLoadoutParameters: LoadoutParameters;
  filterFactory: (query: string) => ItemFilter;
  validateQuery: (query: string) => { valid: boolean };
}

const autoOptimizationContextSelector = currySelector(
  createSelector(
    (_state: RootState, storeId: string) => storeId,
    createItemContextSelector,
    unlockedPlugSetItemsSelector.selector,
    storesSelector,
    savedLoadoutParametersSelector,
    filterFactorySelector,
    validateQuerySelector,
    (
      storeId,
      itemCreationContext,
      unlockedPlugs,
      stores,
      savedLoLoadoutParameters,
      filterFactory,
      validateQuery
    ) => {
      const store = stores.find((s) => s.id === storeId)!;
      const classType = store.classType;
      return {
        itemCreationContext,
        store,
        classType,
        unlockedPlugs,
        savedLoLoadoutParameters,
        filterFactory,
        validateQuery,
      } satisfies AutoOptimizationContext;
    }
  )
);

/**
 * Returns `valid` iff the exotic armor used in the loadout matches
 * the saved exoticArmorHash from LoadoutParameters, and returns in
 * `exoticArmorHash` the exotic that should be locked in Loadout Optimizer.
 */
function matchesExoticArmorHash(
  exoticArmorHash: number | undefined,
  exotic: DimItem | undefined
): [valid: boolean, exoticArmorHash: number | undefined] {
  if (exoticArmorHash === LOCKED_EXOTIC_NO_EXOTIC) {
    return [!exotic, exoticArmorHash];
  } else if (exoticArmorHash === LOCKED_EXOTIC_ANY_EXOTIC) {
    return [Boolean(exotic), exoticArmorHash];
  } else if (exoticArmorHash === undefined) {
    return [true, exotic?.hash];
  } else {
    return [exoticArmorHash === exotic?.hash, exoticArmorHash];
  }
}

/**
 * Extract the parameters for the optimization algorithm from an existing Loadout.
 * This performs some adjustments on the saved parameters and overrides some overly pessimistic
 * settings so that it's useful even if users didn't take care to include accurate LoadoutParameters
 * in every saved Loadout.
 *
 * TODO This basically does the same things as `lbConfigInit` -- merge them when the LO workflow rework happens.
 */
function extractOptimizationParameters(
  autoOptContext: AutoOptimizationContext,
  allItems: DimItem[],
  loadout: Loadout
): AutoOptimizationParameters | LoadoutError {
  const loadoutParameters: LoadoutParameters = {
    ...autoOptContext.savedLoLoadoutParameters,
    ...loadout.parameters,
  };

  let searchFilter;
  if (loadoutParameters.query) {
    const { valid } = autoOptContext.validateQuery(loadoutParameters.query);
    if (!valid) {
      return LoadoutError.BadSearchQuery;
    }
    searchFilter = autoOptContext.filterFactory(loadoutParameters.query);
  } else {
    searchFilter = _.stubTrue;
  }

  const [items, subclass] = getItemsAndSubclassFromLoadout(
    autoOptContext.itemCreationContext,
    loadout.items,
    autoOptContext.store,
    allItems
  );

  const armorEnergyRules: ArmorEnergyRules = {
    minItemEnergy: MIN_LO_ITEM_ENERGY,
    assumeArmorMasterwork: loadoutParameters.assumeArmorMasterwork!,
  };

  const armorItems = items
    .filter((i) => i.loadoutItem.equip && i.item.bucket.inArmor && i.item.energy)
    .map((i) => i.item);
  // A loadout must have 5 equipped armor 2.0 items for comparisons
  // between LO runs and the current loadout to be meaningful
  if (armorItems.length !== 5) {
    return LoadoutError.NotAFullArmorSet;
  }

  // Infer a masterwork setting. If the loadout has a non-masterworked legendary armor,
  // setting stays the same. If all legendaries are MWed but the exotic isn't, set to Legendary only.
  // If the exotic is MWed or there isn't an exotic, assume everything is MWed.
  let allLegendariesMasterworked = true;
  let exoticNotMasterworked = false;
  for (const armorItem of armorItems) {
    if (armorItem.energy!.energyCapacity < MAX_ARMOR_ENERGY_CAPACITY) {
      if (armorItem.isExotic) {
        exoticNotMasterworked = true;
      } else {
        allLegendariesMasterworked = false;
      }
    }
  }
  if (allLegendariesMasterworked) {
    armorEnergyRules.assumeArmorMasterwork =
      exoticNotMasterworked && armorEnergyRules.assumeArmorMasterwork !== AssumeArmorMasterwork.All
        ? AssumeArmorMasterwork.Legendary
        : AssumeArmorMasterwork.All;
  }

  // If the loadout has a given exotic, ensure we find similar loadouts with that same exotic.
  const exotic = armorItems.find((i) => i.isExotic);
  const [valid, newHash] = matchesExoticArmorHash(loadoutParameters.exoticArmorHash, exotic);
  if (!valid) {
    return LoadoutError.DoesNotRespectExotic;
  }
  loadoutParameters.exoticArmorHash = newHash;

  let originalLoadoutMods = getModsFromLoadout(
    autoOptContext.itemCreationContext.defs,
    loadout,
    autoOptContext.unlockedPlugs
  );
  // Remove deprecated mods, since the only logical thing is for the user to drop them.
  originalLoadoutMods = originalLoadoutMods.filter(
    (mod) => !deprecatedMods.includes(mod.resolvedMod.hash)
  );

  const { unassignedMods, invalidMods } = fitMostMods({
    defs: autoOptContext.itemCreationContext.defs,
    items: armorItems,
    plannedMods: originalLoadoutMods.map((mod) => mod.resolvedMod),
    armorEnergyRules,
  });

  // If our loadout can't even fit the mods it was saved with (except for deprecated mods)
  // it's an unfair comparison, so bail here.
  // TODO: Maybe consider all items for mod categorization and ignore invalidMods, since
  // none of the owned items can fit invalidMods in that case and that doesn't cause a difference between loadouts.
  if (unassignedMods.length || invalidMods.length) {
    return LoadoutError.ModsDontFit;
  }

  const setStats = getLoadoutStats(
    autoOptContext.itemCreationContext.defs,
    autoOptContext.classType,
    subclass,
    armorItems,
    originalLoadoutMods.map((mod) => mod.resolvedMod),
    armorEnergyRules
  );

  // Force auto stat mods to on if there are stat mods.
  loadoutParameters.autoStatMods ||= originalLoadoutMods.some(
    (mod) => mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General
  );

  // Save back the actual mods for LO to use
  loadoutParameters.mods = originalLoadoutMods
    .filter(
      (mod) =>
        // drop artifice mods (always picked automatically per set)
        mod.resolvedMod.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsArtifice &&
        // drop general mods if picked automatically
        (!loadoutParameters?.autoStatMods ||
          mod.resolvedMod.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsV2General)
    )
    .map((mod) => mod.originalModHash);

  if (!loadoutParameters?.statConstraints?.some((c) => c.minTier)) {
    // If the user's loadout does not have any lower bounds, then we have no indication
    // that the loadout parameters accurately reflect the stats the user cares about.
    // Converting the existing set stats to tier minimums ensures that every weak upgrade is
    // also a strong upgrade.
    const loadoutStatOrder = [...armorStats].sort(
      compareBy(
        (stat) =>
          loadoutParameters?.statConstraints?.findIndex((c) => c.statHash === stat) ??
          Number.MAX_VALUE
      )
    );
    loadoutParameters.statConstraints = loadoutStatOrder.map((statHash) => ({
      statHash,
      min: statTier(setStats[statHash].value),
      max: 10,
    }));
  }
  // Otherwise, we just retain the stat constraints from the loadout.

  const existingStats: Partial<ArmorStats> = {};
  for (const armorStat of armorStats) {
    existingStats[armorStat] = setStats[armorStat].value;
  }

  return {
    existingStats: existingStats as ArmorStats,
    loadoutParameters,
    subclass,
    searchFilter,
  };
}

export function useAutoOptimization(selectedStoreId: string) {
  const autoOptContext = useSelector(autoOptimizationContextSelector(selectedStoreId));
  const loadouts = useSavedLoadoutsForClassType(autoOptContext.classType);
  const [results, setResults] = useState<AutoOptimizationReport>({});
  const [includeVendorItems] = useSetting('loIncludeVendorItems');
  const { vendorItems } = useLoVendorItems(selectedStoreId, includeVendorItems);
  const armorItems = useArmorItems(autoOptContext.classType, vendorItems);

  const getUserItemTag = useSelector(getTagSelector);

  // Flush the cache when anything changes
  useEffect(
    () => setResults(Object.fromEntries(loadouts.map((l) => [l.id, { tag: 'pending' }] as const))),
    [autoOptContext, loadouts, includeVendorItems, armorItems]
  );

  const nextLoadout = useMemo(
    () => loadouts.find((l) => results[l.id]?.tag === 'pending'),
    [loadouts, results]
  );
  const cleanupRef = useRef<(() => void) | null>();

  // Cleanup worker on unmount
  useEffect(
    () => () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    },
    []
  );

  const autoModOptions = useAutoMods(selectedStoreId);

  useEffect(() => {
    // Stop any previous worker
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!nextLoadout) {
      return;
    }

    const optParamResult = extractOptimizationParameters(autoOptContext, armorItems, nextLoadout);
    if (typeof optParamResult === 'number') {
      setResults((results) => ({
        ...results,
        [nextLoadout.id]: { tag: 'error', error: optParamResult },
      }));
      return;
    }

    const { worker, cleanup } = createWorker();
    cleanupRef.current = cleanup;

    const modsToAssign = resolveLoadoutModHashes(
      autoOptContext.itemCreationContext.defs,
      optParamResult.loadoutParameters.mods ?? [],
      autoOptContext.unlockedPlugs
    ).map((m) => m.resolvedMod);

    const { modMap: lockedModMap, unassignedMods } = categorizeArmorMods(modsToAssign, armorItems);

    const statOrder = statOrderFromLoadoutParameters(optParamResult.loadoutParameters);
    const statFilters = statFiltersFromLoadoutParameters(optParamResult.loadoutParameters);

    const { bucketSpecificMods, activityMods, generalMods } = lockedModMap;

    const lockedProcessMods = {
      generalMods: generalMods.map(mapArmor2ModToProcessMod),
      activityMods: activityMods.map(mapArmor2ModToProcessMod),
    };

    const modStatChanges = getTotalModStatChanges(
      autoOptContext.itemCreationContext.defs,
      modsToAssign,
      optParamResult.subclass,
      autoOptContext.classType,
      true
    );

    const autoModsData = mapAutoMods(autoModOptions);

    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
    };
    if (optParamResult.loadoutParameters.assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork =
        optParamResult.loadoutParameters.assumeArmorMasterwork;
    }
    const [filteredItems] = filterItems({
      defs: autoOptContext.itemCreationContext.defs,
      items: armorItems,
      pinnedItems: {},
      excludedItems: {},
      lockedModMap,
      unassignedMods,
      lockedExoticHash: optParamResult.loadoutParameters.exoticArmorHash,
      armorEnergyRules,
      searchFilter: optParamResult.searchFilter,
    });

    const processItems: ProcessItemsByBucket = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
    };

    for (const [bucketHashStr, items] of Object.entries(filteredItems)) {
      const bucketHash = parseInt(bucketHashStr, 10) as LockableBucketHash;
      processItems[bucketHash] = [];

      const groupedItems = mapItemsToGroups(
        items,
        statOrder,
        armorEnergyRules,
        activityMods,
        bucketSpecificMods[bucketHash] || [],
        getUserItemTag
      );

      for (const group of groupedItems) {
        processItems[bucketHash].push(group.canonicalProcessItem);
      }
    }

    worker
      .process(
        processItems,
        { op: 'optimize', stopOnBetter: true, stats: optParamResult.existingStats },
        _.mapValues(modStatChanges, (stat) => stat.value),
        lockedProcessMods,
        statOrder,
        statFilters,
        optParamResult.loadoutParameters.exoticArmorHash === LOCKED_EXOTIC_ANY_EXOTIC,
        autoModsData,
        Boolean(optParamResult.loadoutParameters.autoStatMods),
        proxy(_.noop)
      )
      .then(({ hasStrongUpgrade, hasWeakUpgrade }) => {
        infoLog('auto-optimizer', 'done');
        const result = hasStrongUpgrade
          ? AutoOptimizationResult.StrongBetterSet
          : hasWeakUpgrade
          ? AutoOptimizationResult.WeakBetterSet
          : AutoOptimizationResult.Nothing;
        setResults((results) => ({ ...results, [nextLoadout.id]: { tag: 'finished', result } }));
      })
      // Cleanup the worker, we don't need it anymore.
      .finally(() => {
        cleanup();
        cleanupRef.current = null;
      });
  }, [autoModOptions, getUserItemTag, nextLoadout, autoOptContext, results, armorItems]);

  return results;
}
