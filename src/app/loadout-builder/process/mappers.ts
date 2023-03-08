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
  AutoModDefs,
  generalSocketReusablePlugSetHash,
  ItemGroup,
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
  defs: D2ManifestDefinitions,
  processed: ProcessArmorSet,
  itemsById: Map<string, ItemGroup>
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById.get(itemId)!.items);
  }

  const statsWithAutoMods = { ...processed.stats };

  for (const modHash of processed.statMods) {
    const def = defs.InventoryItem.get(modHash);
    if (def?.investmentStats.length) {
      for (const stat of def.investmentStats) {
        if (statsWithAutoMods[stat.statTypeHash] !== undefined) {
          statsWithAutoMods[stat.statTypeHash] += stat.value;
        }
      }
    }
  }

  return {
    armor,
    stats: statsWithAutoMods,
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
    largeMods: _.mapValues(defs.largeMods, defToAutoMod),
    smallMods: _.mapValues(defs.smallMods, defToAutoMod),
  };
}

/**
 * Build the automatically pickable mods for the store.
 * FIXME: Bungie created cheap copies of some mods, but they don't have stats, so
 * this code will not extract the reduced-cost copies even if they become available.
 * Re-evaluate this in future seasons if general mods can be affected by artifact cost reductions.
 */
export function getAutoMods(defs: D2ManifestDefinitions, allUnlockedPlugs: Set<number>) {
  const autoMods: AutoModDefs = { largeMods: {}, smallMods: {}, artificeMods: {} };
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
    // Artifice mods give +3 in a single stat, so find the mod for that stat
    const artificeMod = artificePlugSet.find((modDef) =>
      modDef.investmentStats.some((stat) => stat.statTypeHash === statHash && stat.value === 3)
    );
    if (
      artificeMod &&
      (artificeMod.plug.energyCost === undefined || artificeMod.plug.energyCost.energyCost === 0)
    ) {
      autoMods.artificeMods[statHash] = artificeMod;
    }

    // Get all general mods for this stat and sort descending by cost, then group by provided stat value
    const generalModsByValue = _.groupBy(
      generalPlugSet
        .map((def) => {
          const stat =
            def.investmentStats.find((stat) => stat.statTypeHash === statHash) || undefined;
          const cost = def.plug.energyCost?.energyCost ?? 0;
          return { def, stat, cost };
        })
        .sort(compareBy(({ cost }) => -cost)),
      ({ stat }) => stat?.value
    );
    if (!generalModsByValue[10]) {
      continue;
    }
    // Should now be grouped by 5, 10, and undefined
    const [regularPlus10Mod, cheapPlus10Mod] = generalModsByValue[10];
    // Use the cheap +10 mod if available, otherwise the regular
    const usedPlus10Mod =
      cheapPlus10Mod && allUnlockedPlugs.has(cheapPlus10Mod.def.hash)
        ? cheapPlus10Mod
        : regularPlus10Mod;
    autoMods.largeMods[statHash] = usedPlus10Mod.def;

    if (!generalModsByValue[5]) {
      continue;
    }
    const [regularPlus5Mod, cheapPlus5Mod] = generalModsByValue[5];
    // Use the cheap +5 mod if available, otherwise the regular
    const usedPlus5Mod =
      cheapPlus5Mod && allUnlockedPlugs.has(cheapPlus5Mod.def.hash)
        ? cheapPlus5Mod
        : regularPlus5Mod;
    autoMods.smallMods[statHash] = usedPlus5Mod.def;
  }

  return autoMods;
}
