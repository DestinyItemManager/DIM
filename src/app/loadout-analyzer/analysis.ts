import { AssumeArmorMasterwork, LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimCharacterStat } from 'app/inventory/store-types';
import { filterItems } from 'app/loadout-builder/item-filter';
import {
  defaultLoadoutParameters,
  resolveStatConstraints,
} from 'app/loadout-builder/loadout-params';
import { runProcess } from 'app/loadout-builder/process/process-wrapper';
import {
  ArmorEnergyRules,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LOCKED_EXOTIC_NO_EXOTIC,
  MIN_LO_ITEM_ENERGY,
  ResolvedStatConstraint,
  inGameArmorEnergyRules,
} from 'app/loadout-builder/types';
import { statTier } from 'app/loadout-builder/utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import {
  getLoadoutStats,
  getLoadoutSubclassFragmentCapacity,
  resolveLoadoutModHashes,
} from 'app/loadout-drawer/loadout-utils';
import { fullyResolveLoadout } from 'app/loadout/ingame/selectors';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { ModMap, categorizeArmorMods, fitMostMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import { count } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { delay } from 'app/utils/promises';
import { fragmentSocketCategoryHashes, getSocketsByCategoryHashes } from 'app/utils/socket-utils';
import { HashLookup } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import seasonalMods from 'data/d2/seasonal-armor-mods.json';
import { stubTrue } from 'lodash';
import {
  LoadoutAnalysisContext,
  LoadoutAnalysisResult,
  LoadoutFinding,
  blockAnalysisFindings,
} from './types';

export async function analyzeLoadout(
  { allItems, autoModDefs, itemCreationContext, unlockedPlugs }: LoadoutAnalysisContext,
  storeId: string,
  classType: DestinyClass,
  loadout: Loadout,
): Promise<LoadoutAnalysisResult> {
  const findings = new Set<LoadoutFinding>();
  const defs = itemCreationContext.defs;
  const resolvedLoadout = fullyResolveLoadout(
    storeId,
    loadout,
    defs,
    unlockedPlugs,
    itemCreationContext,
    allItems,
  );

  const originalLoadoutMods = resolvedLoadout.resolvedMods;
  const originalModDefs = originalLoadoutMods.map((mod) => mod.resolvedMod);

  const loadoutParameters: LoadoutParameters = {
    ...defaultLoadoutParameters,
    ...loadout.parameters,
  };

  const includeRuntimeStatBenefits = loadoutParameters.includeRuntimeStatBenefits ?? false;

  const subclass = resolvedLoadout.resolvedLoadoutItems.find(
    (i) => i.item.bucket.hash === BucketHashes.Subclass,
  );
  const fragmentProblem = subclass && getFragmentProblems(defs, subclass);
  if (fragmentProblem !== undefined) {
    findings.add(fragmentProblem);
  }

  if (resolvedLoadout.failedResolvedLoadoutItems.length) {
    findings.add(LoadoutFinding.MissingItems);
  }

  const statConstraints = resolveStatConstraints(loadoutParameters.statConstraints ?? []);
  let needUpgrades = false;

  const loadoutArmor = resolvedLoadout.resolvedLoadoutItems
    .filter((item) => item.loadoutItem.equip && item.item.bucket.inArmor)
    .map(({ item }) => item);

  const { modMap, unassignedMods } = categorizeArmorMods(originalModDefs, allItems);
  if (unassignedMods.length) {
    findings.add(LoadoutFinding.InvalidMods);
  }

  // FIXME Run a trimmed down mod assignment algorithm here to find errors in mod-only loadouts?
  // Reuse code from https://github.com/DestinyItemManager/DIM/pull/10017?
  if (
    modMap.artificeMods.length > 5 ||
    modMap.activityMods.length > 5 ||
    modMap.generalMods.length > 5
  ) {
    findings.add(LoadoutFinding.ModsDontFit);
  }

  let hasStrictUpgrade = false;
  let ineligibleForOptimization = false;
  let betterStatsAvailableFontNote = false;
  if (loadoutArmor.length) {
    if (loadoutArmor.length < 5) {
      findings.add(LoadoutFinding.NotAFullArmorSet);
    }

    // If the loadout has a given exotic, ensure we find similar loadouts with that same exotic.
    const exotic =
      loadoutArmor.find((i) => i.isExotic) ??
      resolvedLoadout.failedResolvedLoadoutItems.find((i) => i.item.isExotic && i.loadoutItem.equip)
        ?.item;
    const [valid, newHash] = matchesExoticArmorHash(loadoutParameters.exoticArmorHash, exotic);
    if (!valid) {
      findings.add(LoadoutFinding.DoesNotRespectExotic);
    }
    loadoutParameters.exoticArmorHash = newHash;

    // Infer a masterwork setting. If the loadout has a non-masterworked legendary armor,
    // setting stays the same. If all legendaries are MWed but the exotic isn't, set to Legendary only.
    // If the exotic is MWed or there isn't an exotic, assume everything is MWed.
    let allLegendariesMasterworked = true;
    let exoticNotMasterworked = false;
    for (const armorItem of loadoutArmor) {
      if (armorItem.energy!.energyCapacity < MAX_ARMOR_ENERGY_CAPACITY) {
        if (armorItem.isExotic) {
          exoticNotMasterworked = true;
        } else {
          allLegendariesMasterworked = false;
        }
      }
    }
    if (allLegendariesMasterworked) {
      loadoutParameters.assumeArmorMasterwork =
        exoticNotMasterworked &&
        loadoutParameters.assumeArmorMasterwork !== AssumeArmorMasterwork.All
          ? AssumeArmorMasterwork.Legendary
          : AssumeArmorMasterwork.All;
    } else {
      loadoutParameters.assumeArmorMasterwork ??= AssumeArmorMasterwork.None;
    }

    const armorEnergyRules: ArmorEnergyRules = {
      minItemEnergy: MIN_LO_ITEM_ENERGY,
      assumeArmorMasterwork: loadoutParameters?.assumeArmorMasterwork ?? AssumeArmorMasterwork.None,
    };

    const modProblems = getModProblems(defs, loadoutArmor, modMap, armorEnergyRules);
    needUpgrades ||= modProblems.needsUpgradesForMods;
    if (modProblems.cantFitMods) {
      findings.add(LoadoutFinding.ModsDontFit);
    }
    if (modProblems.usesSeasonalMods) {
      findings.add(LoadoutFinding.UsesSeasonalMods);
    }

    // We just did some heavy mod assignment stuff, give the event loop a chance
    await delay(0);

    if (loadoutParameters.query) {
      findings.add(LoadoutFinding.LoadoutHasSearchQuery);
    }

    if (loadoutArmor.length === 5) {
      const statProblems = getStatProblems(
        defs,
        classType,
        subclass,
        loadoutArmor,
        originalModDefs,
        armorEnergyRules,
        statConstraints,
        includeRuntimeStatBenefits,
      );
      const assumedLoadoutStats = statProblems.stats;
      // If Font mods cause a loadout stats to exceed T10, note this for later
      if (
        Object.values(assumedLoadoutStats).some(
          (stat) =>
            stat && stat.value >= 110 && stat.breakdown!.some((c) => c.source === 'runtimeEffect'),
        )
      ) {
        betterStatsAvailableFontNote = true;
      }

      needUpgrades ||= statProblems.needsUpgradesForStats;

      if (statProblems.cantHitStats) {
        findings.add(LoadoutFinding.DoesNotSatisfyStatConstraints);
      }

      if ($featureFlags.runLoInBackground) {
        ineligibleForOptimization = blockAnalysisFindings.some((finding) => findings.has(finding));
        if (!ineligibleForOptimization) {
          // Force auto stat mods to on if there are stat mods.
          loadoutParameters.autoStatMods ||= originalLoadoutMods.some(
            (mod) =>
              mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General,
          );

          const modsToUse = originalLoadoutMods.filter(
            (mod) =>
              // drop artifice mods (always picked automatically per set)
              mod.resolvedMod.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsArtifice &&
              // drop general mods if picked automatically
              (!loadoutParameters?.autoStatMods ||
                mod.resolvedMod.plug.plugCategoryHash !== PlugCategoryHashes.EnhancementsV2General),
          );
          // Save back the actual mods for LO to use
          const modDefs = modsToUse.map((mod) => mod.resolvedMod);
          loadoutParameters.mods = modsToUse.map((mod) => mod.originalModHash);
          const { modMap } = categorizeArmorMods(modDefs, loadoutArmor);

          // TODO: Include vendor armor here?
          const armorForThisClass = allItems.filter(
            (item) =>
              item.classType === classType && item.bucket.inArmor && isLoadoutBuilderItem(item),
          );
          const [filteredItems] = filterItems({
            defs,
            items: armorForThisClass,
            pinnedItems: {},
            excludedItems: {},
            // We previously reject loadouts where mods can't fit, so no need to pass unassignedMods here.
            lockedModMap: modMap,
            unassignedMods: [],
            lockedExoticHash: loadoutParameters.exoticArmorHash,
            armorEnergyRules,
            // We also reject loadouts with a search filter
            searchFilter: stubTrue,
          });

          const modStatChanges = getTotalModStatChanges(
            defs,
            modDefs,
            subclass,
            classType,
            includeRuntimeStatBenefits,
          );

          // Give the event loop a chance after we did a lot of item filtering
          await delay(0);

          const strictStatConstraints: ResolvedStatConstraint[] = statConstraints.map((c) => ({
            ...c,
            minTier: statTier(assumedLoadoutStats[c.statHash]!.value),
          }));

          loadoutParameters.statConstraints = strictStatConstraints;
          try {
            const { resultPromise } = runProcess({
              anyExotic: loadoutParameters.exoticArmorHash === LOCKED_EXOTIC_ANY_EXOTIC,
              armorEnergyRules,
              autoModDefs,
              autoStatMods: loadoutParameters.autoStatMods,
              filteredItems,
              lockedModMap: modMap,
              modStatChanges,
              resolvedStatConstraints: strictStatConstraints,
              stopOnFirstSet: true,
              strictUpgrades: true,
            });

            hasStrictUpgrade = Boolean((await resultPromise).sets.length);
            if (hasStrictUpgrade) {
              findings.add(LoadoutFinding.BetterStatsAvailable);
            }
          } catch (e) {
            errorLog('loadout analyzer', 'internal error', e);
          }
        }
      }
    }
  }

  if (needUpgrades) {
    findings.add(LoadoutFinding.NeedsArmorUpgrades);
  }

  return {
    findings: [...findings],
    betterStatsAvailableFontNote: hasStrictUpgrade && betterStatsAvailableFontNote,
    armorResults: ineligibleForOptimization
      ? { tag: 'ineligible' }
      : {
          tag: 'done',
          betterStatsAvailable: hasStrictUpgrade ? LoadoutFinding.BetterStatsAvailable : undefined,
          loadoutParameters,
        },
  };
}

/**
 * Returns `valid` iff the exotic armor used in the loadout matches
 * the saved exoticArmorHash from LoadoutParameters, and returns in
 * `exoticArmorHash` the exotic that should be locked in Loadout Optimizer.
 */
function matchesExoticArmorHash(
  exoticArmorHash: number | undefined,
  exotic: DimItem | undefined,
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

function getFragmentProblems(
  defs: D2ManifestDefinitions,
  subclass: ResolvedLoadoutItem,
): LoadoutFinding.TooManyFragments | LoadoutFinding.EmptyFragmentSlots | undefined {
  // this will be 0 if no aspects were provided in the loadout subclass config
  const fragmentCapacity = getLoadoutSubclassFragmentCapacity(defs, subclass, false);
  const fragmentSockets = getSocketsByCategoryHashes(
    subclass.item.sockets,
    fragmentSocketCategoryHashes,
  );
  const loadoutFragments = count(fragmentSockets, (socket) =>
    Boolean(subclass.loadoutItem.socketOverrides?.[socket.socketIndex]),
  );

  return loadoutFragments < fragmentCapacity
    ? LoadoutFinding.EmptyFragmentSlots
    : loadoutFragments > fragmentCapacity
    ? LoadoutFinding.TooManyFragments
    : undefined;
}

function getModProblems(
  defs: D2ManifestDefinitions,
  loadoutArmor: DimItem[],
  modMap: ModMap,
  loadoutArmorEnergyRules: ArmorEnergyRules,
): {
  cantFitMods: boolean;
  needsUpgradesForMods: boolean;
  usesSeasonalMods: boolean;
} {
  const allValidMods = modMap.allMods;
  let cantFitMods = false;
  let needsUpgradesForMods = false;
  let usesSeasonalMods = allValidMods.some((mod) => seasonalMods.includes(mod.hash));

  if (loadoutArmor.length === 5) {
    const canFitModsWithRules = (
      armorEnergyRules: ArmorEnergyRules,
      mods: PluggableInventoryItemDefinition[],
    ) => {
      const { unassignedMods, invalidMods: invalidModsForThisSet } = fitMostMods({
        defs,
        armorEnergyRules,
        items: loadoutArmor,
        plannedMods: mods,
      });
      return !invalidModsForThisSet.length && !unassignedMods.length;
    };
    const canFitModsAsIs = canFitModsWithRules(inGameArmorEnergyRules, allValidMods);
    const canFitModsWithUpgrades =
      canFitModsAsIs || canFitModsWithRules(loadoutArmorEnergyRules, allValidMods);

    needsUpgradesForMods = !canFitModsAsIs && canFitModsWithUpgrades;
    cantFitMods = !canFitModsWithUpgrades;

    // If we don't already know that we're using seasonal mods and we can currently fit mods,
    // try assigning mods while assuming no cheaper mods are unlocked, so that we use the expensive variant
    // of all mods. If that fails we know that the loadout relies on seasonal mods.
    usesSeasonalMods ||=
      canFitModsWithUpgrades &&
      !canFitModsWithRules(
        loadoutArmorEnergyRules,
        resolveLoadoutModHashes(
          defs,
          allValidMods.map((mod) => mod.hash),
          /* unlockedPlugs */ new Set(),
        ).map((mod) => mod.resolvedMod),
      );
  }

  return {
    cantFitMods,
    needsUpgradesForMods,
    usesSeasonalMods,
  };
}

function getStatProblems(
  defs: D2ManifestDefinitions,
  classType: DestinyClass,
  subclass: ResolvedLoadoutItem | undefined,
  loadoutArmor: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  loadoutArmorEnergyRules: ArmorEnergyRules,
  resolvedStatConstraints: ResolvedStatConstraint[],
  includeRuntimeStatBenefits: boolean,
): {
  stats: HashLookup<DimCharacterStat>;
  cantHitStats: boolean;
  needsUpgradesForStats: boolean;
} {
  const canHitStatsWithRules = (armorEnergyRules: ArmorEnergyRules) => {
    const stats = getLoadoutStats(
      defs,
      classType,
      subclass,
      loadoutArmor,
      mods,
      includeRuntimeStatBenefits,
      armorEnergyRules,
    );
    return {
      stats,
      canHitStats: resolvedStatConstraints.every(
        (c) => c.ignored || statTier(stats[c.statHash].value ?? 0) >= c.minTier,
      ),
    };
  };

  const canHitStatsAsIs = canHitStatsWithRules(inGameArmorEnergyRules).canHitStats;
  const { stats, canHitStats: canHitStatsWithUpgrades } =
    canHitStatsWithRules(loadoutArmorEnergyRules);

  return {
    stats,
    cantHitStats: !canHitStatsWithRules,
    needsUpgradesForStats: canHitStatsWithUpgrades && !canHitStatsAsIs,
  };
}
