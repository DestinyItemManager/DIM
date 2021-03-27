import { modsWithConditionalStats } from 'app/search/d2-known-values';
import { chargedWithLightPlugCategoryHashes } from 'app/search/specialty-modslots';
import {
  DestinyClass,
  DestinyEnergyType,
  DestinyItemInvestmentStatDefinition,
} from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
} from '../../utils/item-utils';
import { ProcessArmorSet, ProcessItem, ProcessMod } from '../process-worker/types';
import {
  ArmorSet,
  knownModPlugCategoryHashes,
  LockedMod,
  LockedModMap,
  raidPlugCategoryHashes,
  statHashToType,
  StatTypes,
} from '../types';

export function mapArmor2ModToProcessMod(mod: LockedMod): ProcessMod {
  const processMod: ProcessMod = {
    hash: mod.modDef.hash,
    plugCategoryHash: mod.modDef.plug.plugCategoryHash,
    energy: mod.modDef.plug.energyCost && {
      type: mod.modDef.plug.energyCost.energyType,
      val: mod.modDef.plug.energyCost.energyCost,
    },
    investmentStats: mod.modDef.investmentStats,
  };

  if (
    raidPlugCategoryHashes.includes(processMod.plugCategoryHash) ||
    !knownModPlugCategoryHashes.includes(processMod.plugCategoryHash)
  ) {
    processMod.tag = getModTypeTagByPlugCategoryHash(mod.modDef.plug.plugCategoryHash);
  }

  return processMod;
}

function isModStatActive(
  characterClass: DestinyClass,
  plugHash: number,
  stat: DestinyItemInvestmentStatDefinition,
  lockedMods: LockedMod[]
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
    // also trigger it but we dont know that until we try to socket them. Basically it is too hard
    // to figure that condition out so lets leave it as a known issue for now.
    return Boolean(
      lockedMods.find(
        (mod) =>
          mod.modDef.plug.energyCost?.energyType === DestinyEnergyType.Arc &&
          chargedWithLightPlugCategoryHashes.includes(mod.modDef.plug.plugCategoryHash)
      )
    );
  } else if (plugHash === modsWithConditionalStats.chargeHarvester) {
    // Charge Harvester
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
  lockedArmor2Mods: LockedModMap,
  characterClass?: DestinyClass
) {
  const totals: { [stat in StatTypes]: number } = {
    Mobility: 0,
    Recovery: 0,
    Resilience: 0,
    Intellect: 0,
    Discipline: 0,
    Strength: 0,
  };

  // This should only happen on initialisation if the store is undefined.
  if (!characterClass) {
    return totals;
  }

  const flatMods = Object.values(lockedArmor2Mods)
    .flat()
    .filter((mod): mod is LockedMod => Boolean(mod));

  for (const mods of Object.values(lockedArmor2Mods)) {
    for (const mod of mods || []) {
      for (const stat of mod.modDef.investmentStats) {
        const statType = statHashToType[stat.statTypeHash];
        if (statType && isModStatActive(characterClass, mod.modDef.hash, stat, flatMods)) {
          totals[statType] += stat.value;
        }
      }
    }
  }

  return totals;
}

export function mapDimItemToProcessItem(dimItem: DimItem, modsForSlot?: LockedMod[]): ProcessItem {
  const { bucket, id, type, name, equippingLabel, basePower, stats, energy } = dimItem;

  const baseStatMap: { [statHash: number]: number } = {};

  if (stats) {
    for (const { statHash, base } of stats) {
      baseStatMap[statHash] = base;
    }
  }

  const modMetadatas = getSpecialtySocketMetadatas(dimItem);
  const modsCost = modsForSlot
    ? _.sumBy(modsForSlot, (mod) => mod.modDef.plug.energyCost?.energyCost || 0)
    : 0;

  return {
    bucketHash: bucket.hash,
    id,
    type,
    name,
    equippingLabel,
    basePower,
    baseStats: baseStatMap,
    energy: energy
      ? {
          type: energy.energyType,
          capacity: energy.energyCapacity,
          val: modsCost,
        }
      : undefined,
    compatibleModSeasons: modMetadatas?.flatMap((m) => m.compatibleModTags),
    hasLegacyModSocket: Boolean(modMetadatas?.some((m) => m.slotTag === 'legacy')),
  };
}

export function hydrateArmorSet(
  processed: ProcessArmorSet,
  itemsById: Map<string, DimItem[]>
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById.get(itemId)!);
  }

  return {
    armor,
    stats: processed.stats,
  };
}
