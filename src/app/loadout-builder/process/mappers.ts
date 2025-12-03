import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPluggableItem } from 'app/inventory/store/sockets';
import {
  isPlugStatActive,
  mapAndFilterInvestmentStats,
} from 'app/inventory/store/stats-conditional';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { calculateAssumedItemEnergy, isAssumedArtifice } from 'app/loadout/armor-upgrade-utils';
import {
  activityModPlugCategoryHashes,
  knownModPlugCategoryHashes,
  MAX_STAT,
} from 'app/loadout/known-values';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap, mapValues, sumBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { getArmor3TuningSocket } from 'app/utils/socket-utils';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import { StatHashes } from 'data/d2/generated-enums';
import { minBy } from 'es-toolkit';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadata,
} from '../../utils/item-utils';
import { AutoModData, ProcessItem, ProcessMod } from '../process-worker/types';
import {
  ArmorEnergyRules,
  artificeSocketReusablePlugSetHash,
  artificeStatBoost,
  AutoModDefs,
  DesiredStatRange,
  generalSocketReusablePlugSetHash,
  majorStatBoost,
  minorStatBoost,
} from '../types';

export function mapArmor2ModToProcessMod(mod: PluggableInventoryItemDefinition): ProcessMod {
  const processMod: ProcessMod = {
    hash: mod.hash,
    energyCost: mod.plug.energyCost?.energyCost ?? 0,
  };

  if (
    activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash) ||
    !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
  ) {
    processMod.tag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
  }

  return processMod;
}

/**
 * Turns a real DimItem, armor upgrade rules, and bucket specific mods into the bits of
 * information relevant for LO.
 * This may return multiple variations on the item, each with a different tuning mod plugged in.
 * This requires that bucket specific mods have been validated before.
 */
export function mapDimItemToProcessItems({
  dimItem,
  armorEnergyRules,
  modsForSlot,
  desiredStatRanges,
  autoStatMods,
}: {
  dimItem: DimItem;
  armorEnergyRules: ArmorEnergyRules;
  modsForSlot?: PluggableInventoryItemDefinition[];
  desiredStatRanges: DesiredStatRange[];
  autoStatMods: boolean;
}): ProcessItem[] {
  const { id, hash, name, isExotic, power, setBonus } = dimItem;

  const stats = calculateAssumedMasterworkStats(dimItem, armorEnergyRules);
  const capacity = calculateAssumedItemEnergy(dimItem, armorEnergyRules);
  const compatibleActivityMod = getSpecialtySocketMetadata(dimItem)?.slotTag;
  const modsCost = modsForSlot
    ? sumBy(modsForSlot, (mod) => mod.plug.energyCost?.energyCost ?? 0)
    : 0;

  const assumeArtifice = isAssumedArtifice(dimItem, armorEnergyRules);

  const processItem: ProcessItem = {
    id,
    hash,
    name,
    isExotic,
    isArtifice: assumeArtifice,
    power,
    stats,
    remainingEnergyCapacity: capacity - modsCost,
    compatibleActivityMod: compatibleActivityMod,
    setBonus: setBonus?.hash,
  };

  const tuningSocket = getArmor3TuningSocket(dimItem);

  // Make a version of the item for each possible tuning mod that could be applied.
  if (autoStatMods && tuningSocket?.reusablePlugItems?.length) {
    const processItems: ProcessItem[] = [];
    const allPlugs = tuningSocket.plugSet?.plugs;
    // By default, we'll sacrifice the last ignored stat, or the last from among the lowest maximums
    const defaultDumpStat =
      desiredStatRanges.findLast((r) => r.maxStat === 0)?.statHash ??
      minBy(Array.from(desiredStatRanges.entries()), ([i, r]) => r.maxStat * 1000 - i)?.[1]
        .statHash;

    for (const { plugItemHash, enabled } of tuningSocket.reusablePlugItems) {
      if (!enabled || emptyPlugHashes.has(plugItemHash)) {
        continue;
      }
      const plug = allPlugs?.find((p) => p.plugDef.hash === plugItemHash);
      if (plug) {
        const def = plug.plugDef;
        if (isPluggableItem(def) && def.investmentStats?.length) {
          const tunedStats = { ...stats };
          let dumpStatHash: StatHashes | undefined = undefined;
          for (const { statTypeHash, activationRule, value } of mapAndFilterInvestmentStats(def)) {
            if (
              armorStats.includes(statTypeHash) &&
              isPlugStatActive(activationRule, { item: dimItem, statHash: statTypeHash })
            ) {
              tunedStats[statTypeHash] = Math.min(MAX_STAT, tunedStats[statTypeHash] + value);
              if (value < 0) {
                dumpStatHash = statTypeHash;
              }
            }
          }
          const desiredMax = dumpStatHash
            ? desiredStatRanges.find((r) => r.statHash === dumpStatHash)!.maxStat
            : 0;
          // If we are dumping
          if (
            // This is balanced tuning
            dumpStatHash === undefined ||
            // This is dumping the stat we want to dump
            (defaultDumpStat && dumpStatHash === defaultDumpStat) ||
            // The maximum is low enough that we might actually want to dump this stat to benefit others
            (desiredMax > 0 && desiredMax <= 175)
          ) {
            processItems.push({ ...processItem, includedTuningMod: def.hash, stats: tunedStats });
          }
        }
      }
    }
    return processItems;
  }

  return [processItem];
}

export function mapAutoMods(defs: AutoModDefs): AutoModData {
  const defToAutoMod = (def: PluggableInventoryItemDefinition) => ({
    hash: def.hash,
    cost: def.plug.energyCost?.energyCost ?? 0,
  });
  const defToHash = (def: PluggableInventoryItemDefinition) => def.hash;
  return {
    artificeMods: mapValues(defs.artificeMods, defToHash),
    generalMods: mapValues(defs.generalMods, (modsForStat) => mapValues(modsForStat, defToAutoMod)),
  };
}

/**
 * Build the automatically pickable mods for the store.
 * FIXME: Bungie created cheap copies of some mods, but they don't have stats, so
 * this code will not extract the reduced-cost copies even if they become available.
 * Re-evaluate this in future seasons if general mods can be affected by artifact cost reductions.
 */
export function getAutoMods(defs: D2ManifestDefinitions, allUnlockedPlugs: Set<number>) {
  const autoMods: AutoModDefs = { generalMods: {}, artificeMods: {} };
  // Only consider plugs that give stats
  const mapPlugSet = (plugSetHash: number) =>
    filterMap(defs.PlugSet.get(plugSetHash)?.reusablePlugItems ?? [], (plugEntry) => {
      const def = defs.InventoryItem.get(plugEntry.plugItemHash);
      return isPluggableItem(def) && def.investmentStats?.length ? def : undefined;
    });
  const generalPlugSet = mapPlugSet(generalSocketReusablePlugSetHash);
  const artificePlugSet = mapPlugSet(artificeSocketReusablePlugSetHash);

  for (const statHash of armorStats) {
    // Artifice mods give a small boost in a single stat, so find the mod for that stat
    const artificeMod = artificePlugSet.find((modDef) =>
      modDef.investmentStats.some(
        (stat) => stat.statTypeHash === statHash && stat.value === artificeStatBoost,
      ),
    );
    if (
      artificeMod &&
      (artificeMod.plug.energyCost === undefined || artificeMod.plug.energyCost.energyCost === 0)
    ) {
      autoMods.artificeMods[statHash] = artificeMod;
    }

    const findUnlockedModByValue = (value: number) => {
      const relevantMods = generalPlugSet.filter((def) =>
        def.investmentStats.find((stat) => stat.statTypeHash === statHash && stat.value === value),
      );
      relevantMods.sort(compareBy((def) => -(def.plug.energyCost?.energyCost ?? 0)));
      const [largeMod, smallMod] = relevantMods;
      return smallMod && allUnlockedPlugs.has(smallMod.hash) ? smallMod : largeMod;
    };

    const majorMod = findUnlockedModByValue(majorStatBoost);
    const minorMod = findUnlockedModByValue(minorStatBoost);
    if (majorMod && minorMod) {
      autoMods.generalMods[statHash] = { majorMod, minorMod };
    }
  }

  return autoMods;
}
