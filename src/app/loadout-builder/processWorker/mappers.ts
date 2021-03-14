import _ from 'lodash';
import { DimItem, DimSocket, DimSockets } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
} from '../../utils/item-utils';
import {
  ArmorSet,
  knownModPlugCategoryHashes,
  LockedMod,
  LockedModMap,
  raidPlugCategoryHashes,
  statHashToType,
  StatTypes,
} from '../types';
import { ProcessArmorSet, ProcessItem, ProcessMod, ProcessSocket, ProcessSockets } from './types';

function mapDimSocketToProcessSocket(dimSocket: DimSocket): ProcessSocket {
  return {
    plug: dimSocket.plugged && {
      stats: dimSocket.plugged.stats,
      plugItemHash: dimSocket.plugged.plugDef.hash,
    },
    plugOptions: dimSocket.plugOptions.map((dimPlug) => ({
      stats: dimPlug.stats,
      plugItemHash: dimPlug.plugDef.hash,
    })),
  };
}

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

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items base values have been summed. This mimics how mods
 * effect stat values in game and allows us to do some preprocessing.
 */
export function getTotalModStatChanges(lockedArmor2Mods: LockedModMap) {
  const totals: { [stat in StatTypes]: number } = {
    Mobility: 0,
    Recovery: 0,
    Resilience: 0,
    Intellect: 0,
    Discipline: 0,
    Strength: 0,
  };

  for (const mods of Object.values(lockedArmor2Mods)) {
    for (const mod of mods || []) {
      for (const stat of mod.modDef.investmentStats) {
        const statType = statHashToType[stat.statTypeHash];
        if (statType) {
          totals[statType] += stat.value;
        }
      }
    }
  }

  return totals;
}

function mapDimSocketsToProcessSockets(dimSockets: DimSockets): ProcessSockets {
  return {
    sockets: dimSockets.allSockets.map(mapDimSocketToProcessSocket),
    categories: dimSockets.categories.map((category) => ({
      categoryStyle: category.category.categoryStyle,
      sockets: category.sockets.map(mapDimSocketToProcessSocket),
    })),
  };
}

export function mapDimItemToProcessItem(dimItem: DimItem, modsForSlot?: LockedMod[]): ProcessItem {
  const { bucket, id, type, name, equippingLabel, basePower, stats } = dimItem;

  const statMap: { [statHash: number]: number } = {};
  const baseStatMap: { [statHash: number]: number } = {};

  if (stats) {
    for (const { statHash, value, base } of stats) {
      statMap[statHash] = value;
      baseStatMap[statHash] = base;
    }
  }

  const modMetadatas = getSpecialtySocketMetadatas(dimItem);
  const modsCost = modsForSlot
    ? _.sumBy(modsForSlot, (mod) => mod.modDef.plug.energyCost?.energyCost || 0)
    : 0;
  const costInitial = dimItem.energy ? modsCost : null;
  return {
    bucketHash: bucket.hash,
    id,
    type,
    name,
    equippingLabel,
    basePower,
    stats: statMap,
    baseStats: baseStatMap,
    sockets: dimItem.sockets && mapDimSocketsToProcessSockets(dimItem.sockets),
    energy:
      dimItem.energy && costInitial !== null
        ? {
            type: dimItem.energy.energyType,
            val: costInitial,
          }
        : null,
    compatibleModSeasons: modMetadatas?.flatMap((m) => m.compatibleModTags),
    hasLegacyModSocket: Boolean(modMetadatas?.some((m) => m.slotTag === 'legacy')),
  };
}

export function hydrateArmorSet(
  processed: ProcessArmorSet,
  itemsById: { [id: string]: DimItem[] }
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById[itemId]);
  }

  return {
    armor,
    stats: processed.stats,
  };
}
