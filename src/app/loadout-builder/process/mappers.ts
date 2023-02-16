import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
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
import { chargedWithLightPlugCategoryHashes } from 'app/search/specialty-modslots';
import {
  DestinyClass,
  DestinyEnergyType,
  DestinyItemInvestmentStatDefinition,
} from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
} from '../../utils/item-utils';
import { artificeStatMods } from '../process-worker/auto-stat-mod-utils';
import { ProcessArmorSet, ProcessItem, ProcessMod } from '../process-worker/types';
import { ArmorEnergyRules, ArmorSet, ArmorStats, ItemGroup, StatFilters } from '../types';
import { statTier } from '../utils';

export function mapArmor2ModToProcessMod(mod: PluggableInventoryItemDefinition): ProcessMod {
  const processMod: ProcessMod = {
    hash: mod.hash,
    plugCategoryHash: mod.plug.plugCategoryHash,
    energy: mod.plug.energyCost && {
      val: mod.plug.energyCost.energyCost,
    },
    investmentStats: mod.investmentStats,
  };

  if (
    activityModPlugCategoryHashes.includes(processMod.plugCategoryHash) ||
    !knownModPlugCategoryHashes.includes(processMod.plugCategoryHash)
  ) {
    processMod.tag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
  }

  return processMod;
}

export function isModStatActive(
  characterClass: DestinyClass,
  plugHash: number,
  stat: DestinyItemInvestmentStatDefinition,
  lockedMods: PluggableInventoryItemDefinition[]
): boolean {
  if (!stat.isConditionallyActive) {
    return true;
  } else if (
    plugHash === modsWithConditionalStats.powerfulFriends ||
    plugHash === modsWithConditionalStats.radiantLight
  ) {
    // Powerful Friends & Radiant Light
    // True if another arc charged with light mod is found
    // Note the this is not entirely correct as another arc mod slotted into the same item would
    // also trigger it but we don't know that until we try to socket them. Basically it is too hard
    // to figure that condition out so lets leave it as a known issue for now.
    return Boolean(
      lockedMods.find(
        (mod) =>
          mod.plug.energyCost?.energyType === DestinyEnergyType.Arc &&
          chargedWithLightPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
      )
    );
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
      if (
        stat.statTypeHash in totals &&
        isModStatActive(characterClass, mod.hash, stat, lockedMods)
      ) {
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
    isArtifice: Boolean(
      dimItem.sockets?.allSockets.some((socket) => socket.plugged?.plugDef.hash === 3727270518)
    ),
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
  itemsById: Map<string, ItemGroup>,
  statFilters: StatFilters
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById.get(itemId)!.items);
  }

  const statMods = [];
  const artificeMods = [];
  for (const mod of processed.statMods) {
    if (Object.values(artificeStatMods).some(({ hash }) => hash === mod)) {
      artificeMods.push(mod);
    } else {
      statMods.push(mod);
    }
  }

  const statsWithAutoMods = { ...processed.stats };
  for (const modHash of statMods) {
    const def = defs.InventoryItem.get(modHash);
    if (def?.investmentStats.length) {
      for (const stat of def.investmentStats) {
        if (statsWithAutoMods[stat.statTypeHash] !== undefined) {
          statsWithAutoMods[stat.statTypeHash] += stat.value;
        }
      }
    }
  }

  const artificeBoostedStats = _.mapValues(processed.stats, () => 0);

  for (const artificeModHash of artificeMods) {
    const [statHash] = Object.entries(artificeStatMods).find(
      ([_statHash, { hash }]) => hash === artificeModHash
    )!;
    artificeBoostedStats[statHash] += 3;
    statsWithAutoMods[statHash] += 3;
  }

  const totalTier = _.sum(
    Object.values(statsWithAutoMods).map((statValue) => statTier(statValue, 10))
  );
  const enabledTier = _.sumBy(armorStats, (statHash) =>
    statTier(
      statsWithAutoMods[statHash],
      statFilters[statHash].ignored ? 0 : statFilters[statHash].max
    )
  );

  return {
    armor,
    totalTier,
    enabledTier,
    stats: statsWithAutoMods,
    artificeBoostedStats,
    statMods,
    artificeMods,
  };
}
