import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isArtifice } from 'app/item-triage/triage-utils';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import {
  activityModPlugCategoryHashes,
  knownModPlugCategoryHashes,
} from 'app/loadout/known-values';
import {
  armorStats,
  MAX_ARMOR_ENERGY_CAPACITY,
  modsWithConditionalStats,
} from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { DestinyClass, DestinyItemInvestmentStatDefinition } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
} from '../../utils/item-utils';
import { AutoModData, ProcessArmorSet, ProcessItem, ProcessMod } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorSet,
  ArmorStats,
  artificeSocketReusablePlugSetHash,
  artificeStatBoost,
  AutoModDefs,
  generalSocketReusablePlugSetHash,
  ItemGroup,
  majorStatBoost,
  minorStatBoost,
} from '../types';

export function mapArmor2ModToProcessMod(mod: PluggableInventoryItemDefinition): ProcessMod {
  const processMod: ProcessMod = {
    hash: mod.hash,
    energy: mod.plug.energyCost && {
      val: mod.plug.energyCost.energyCost,
    },
  };

  if (
    activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash) ||
    !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
  ) {
    processMod.tag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
  }

  return processMod;
}

export function isModStatActive(
  characterClass: DestinyClass,
  plugHash: number,
  stat: DestinyItemInvestmentStatDefinition
): boolean {
  if (!stat.isConditionallyActive) {
    return true;
  } else if (
    plugHash === modsWithConditionalStats.chargeHarvester ||
    plugHash === modsWithConditionalStats.echoOfPersistence ||
    plugHash === modsWithConditionalStats.sparkOfFocus
  ) {
    // "-10 to the stat that governs your class ability recharge"
    return (
      (characterClass === DestinyClass.Hunter && stat.statTypeHash === StatHashes.Mobility) ||
      (characterClass === DestinyClass.Titan && stat.statTypeHash === StatHashes.Resilience) ||
      (characterClass === DestinyClass.Warlock && stat.statTypeHash === StatHashes.Recovery)
    );
  } else {
    return true;
  }
}

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items base values have been summed. This mimics how mods
 * effect stat values in game and allows us to do some preprocessing.
 */
export function getTotalModStatChanges(
  lockedMods: PluggableInventoryItemDefinition[],
  subclassPlugs: PluggableInventoryItemDefinition[],
  characterClass: DestinyClass
) {
  const totals: ArmorStats = {
    [StatHashes.Mobility]: 0,
    [StatHashes.Recovery]: 0,
    [StatHashes.Resilience]: 0,
    [StatHashes.Intellect]: 0,
    [StatHashes.Discipline]: 0,
    [StatHashes.Strength]: 0,
  };

  for (const mod of lockedMods.concat(subclassPlugs)) {
    for (const stat of mod.investmentStats) {
      if (stat.statTypeHash in totals && isModStatActive(characterClass, mod.hash, stat)) {
        totals[stat.statTypeHash] += stat.value;
      }
    }
  }

  return totals;
}

/**
 * Turns a real DimItem, armor upgrade rules, and bucket specific mods into the bits of
 * information relevant for LO. This requires that bucket specific mods have been validated
 * before.
 */
export function mapDimItemToProcessItem({
  dimItem,
  armorEnergyRules,
  modsForSlot,
}: {
  dimItem: DimItem;
  armorEnergyRules: ArmorEnergyRules;
  modsForSlot?: PluggableInventoryItemDefinition[];
}): ProcessItem {
  const { id, hash, name, isExotic, power, stats: dimItemStats, energy } = dimItem;

  const statMap: { [statHash: number]: number } = {};
  const capacity = calculateAssumedItemEnergy(dimItem, armorEnergyRules);

  if (dimItemStats) {
    for (const { statHash, base } of dimItemStats) {
      let value = base;
      if (capacity === MAX_ARMOR_ENERGY_CAPACITY) {
        value += 2;
      }
      statMap[statHash] = value;
    }
  }

  const modMetadatas = getSpecialtySocketMetadatas(dimItem);
  const modsCost = modsForSlot
    ? _.sumBy(modsForSlot, (mod) => mod.plug.energyCost?.energyCost || 0)
    : 0;

  return {
    id,
    hash,
    name,
    isExotic,
    isArtifice: isArtifice(dimItem),
    power,
    stats: statMap,
    energy: energy
      ? {
          capacity,
          val: modsCost,
        }
      : undefined,
    compatibleModSeasons: modMetadatas?.flatMap((m) => m.compatibleModTags),
  };
}

export function hydrateArmorSet(
  processed: ProcessArmorSet,
  itemsById: Map<string, ItemGroup>
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById.get(itemId)!.items);
  }

  return {
    armor,
    stats: processed.stats,
    statMods: processed.statMods,
  };
}

export function mapAutoMods(defs: AutoModDefs): AutoModData {
  const defToAutoMod = (def: PluggableInventoryItemDefinition) => ({
    hash: def.hash,
    cost: def.plug.energyCost?.energyCost ?? 0,
  });
  const defToArtificeMod = (def: PluggableInventoryItemDefinition) => ({
    hash: def.hash,
  });
  return {
    artificeMods: _.mapValues(defs.artificeMods, defToArtificeMod),
    generalMods: _.mapValues(defs.generalMods, (modsForStat) =>
      _.mapValues(modsForStat, defToAutoMod)
    ),
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
    _.compact(
      defs.PlugSet.get(plugSetHash)?.reusablePlugItems.map((plugEntry) => {
        const def = defs.InventoryItem.get(plugEntry.plugItemHash);
        return isPluggableItem(def) && def.investmentStats?.length && def;
      }) ?? []
    );
  const generalPlugSet = mapPlugSet(generalSocketReusablePlugSetHash);
  const artificePlugSet = mapPlugSet(artificeSocketReusablePlugSetHash);

  for (const statHash of armorStats) {
    // Artifice mods give a small boost in a single stat, so find the mod for that stat
    const artificeMod = artificePlugSet.find((modDef) =>
      modDef.investmentStats.some(
        (stat) => stat.statTypeHash === statHash && stat.value === artificeStatBoost
      )
    );
    if (
      artificeMod &&
      (artificeMod.plug.energyCost === undefined || artificeMod.plug.energyCost.energyCost === 0)
    ) {
      autoMods.artificeMods[statHash] = artificeMod;
    }

    const findUnlockedModByValue = (value: number) => {
      const relevantMods = generalPlugSet.filter((def) =>
        def.investmentStats.find((stat) => stat.statTypeHash === statHash && stat.value === value)
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
