import _ from 'lodash';
import { DimSocket, DimSockets, D2Item, DimItem } from '../../inventory/item-types';
import {
  ProcessSocket,
  ProcessMod,
  LockedArmor2ProcessMods,
  ProcessSockets,
  ProcessItem,
  ProcessArmorSet,
} from './types';
import { LockedModBase, LockedArmor2ModMap, ArmorSet, statHashToType, StatTypes } from '../types';
import {
  getSpecialtySocketMetadataByPlugCategoryHash,
  getSpecialtySocketMetadata,
} from '../../utils/item-utils';
import { DestinyItemInvestmentStatDefinition } from 'bungie-api-ts/destiny2';

function mapDimSocketToProcessSocket(dimSocket: DimSocket): ProcessSocket {
  return {
    plug: dimSocket.plug && {
      stats: dimSocket.plug.stats,
      plugItemHash: dimSocket.plug.plugItem.hash,
    },
    plugOptions: dimSocket.plugOptions.map((dimPlug) => ({
      stats: dimPlug.stats,
      plugItemHash: dimPlug.plugItem.hash,
    })),
  };
}

/**
 * Maps the seasonal mods from the PerkPicker to ProcessMods.
 *
 * TODO When ModPicker is fully merged delete this.
 */
export function mapSeasonalModsToProcessMods(
  lockedSeasonalMods: readonly LockedModBase[]
): ProcessMod[] {
  const metadatas = lockedSeasonalMods.map((mod) => ({
    mod,
    metadata: getSpecialtySocketMetadataByPlugCategoryHash(mod.mod.plug.plugCategoryHash),
  }));

  const modMetadata: ProcessMod[] = [];
  for (const entry of metadatas) {
    modMetadata.push({
      season: entry.metadata?.season,
      tag: entry.metadata?.tag,
      energyType: entry.mod.mod.plug.energyCost.energyType,
      investmentStats: entry.mod.mod.investmentStats.map(({ statTypeHash, value }) => ({
        statTypeHash,
        value,
      })),
    });
  }

  return modMetadata;
}

/**
 * Maps armour 2.0 mods from the ModPicker to ProcessMods.
 */
export function mapArmor2ModsToProcessMods(
  lockedMods: LockedArmor2ModMap
): LockedArmor2ProcessMods {
  const seasonalMetas = lockedMods.seasonal.map((mod) =>
    getSpecialtySocketMetadataByPlugCategoryHash(mod.mod.plug.plugCategoryHash)
  );

  return _.mapValues(lockedMods, (mods) =>
    mods.map((mod, index) => {
      const processMod = {
        energyType: mod.mod.plug.energyCost.energyType,
        investmentStats: mod.mod.investmentStats,
      };

      if (mod.category === 'seasonal') {
        return {
          ...processMod,
          season: seasonalMetas[index]?.season,
          tag: seasonalMetas[index]?.tag,
        };
      }

      return processMod;
    })
  );
}

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items base values have been summed. This mimics how seasonal mods
 * effect stat values in game and allows us to do some preprocessing.
 *
 * For the Mod Picker this can be used for seasonal and general mods. For mods in perk picker this is
 * just for the seasonal mods.
 */
export function getTotalModStatChanges(
  lockedSeasonalMods: readonly { mod: { investmentStats: DestinyItemInvestmentStatDefinition[] } }[]
) {
  const totals: { [stat in StatTypes]: number } = {
    Mobility: 0,
    Recovery: 0,
    Resilience: 0,
    Intellect: 0,
    Discipline: 0,
    Strength: 0,
  };

  for (const mod of lockedSeasonalMods) {
    for (const stat of mod.mod.investmentStats) {
      const statType = statHashToType[stat.statTypeHash];
      if (statType) {
        totals[statType] += stat.value;
      }
    }
  }

  return totals;
}

function mapDimSocketsToProcessSockets(dimSockets: DimSockets): ProcessSockets {
  return {
    sockets: dimSockets.sockets.map(mapDimSocketToProcessSocket),
    categories: dimSockets.categories.map((category) => ({
      categoryStyle: category.category.categoryStyle,
      sockets: category.sockets.map(mapDimSocketToProcessSocket),
    })),
  };
}

export function mapDimItemToProcessItem(dimItem: D2Item): ProcessItem {
  const { bucket, id, type, name, equippingLabel, basePower, stats } = dimItem;

  const statMap: { [statHash: number]: number } = {};
  const baseStatMap: { [statHash: number]: number } = {};

  if (stats) {
    for (const { statHash, value, base } of stats) {
      statMap[statHash] = value;
      baseStatMap[statHash] = base;
    }
  }

  const modMetadata = getSpecialtySocketMetadata(dimItem);

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
    energyType: dimItem.energy?.energyType,
    season: modMetadata?.season,
    compatibleModSeasons: modMetadata?.compatibleTags,
  };
}

export function hydrateArmorSet(
  processed: ProcessArmorSet,
  itemsById: { [id: string]: DimItem }
): ArmorSet {
  const sets: ArmorSet['sets'] = [];

  for (const processSet of processed.sets) {
    const armor: DimItem[][] = [];

    for (const itemIds of processSet.armor) {
      armor.push(itemIds.map((id) => itemsById[id]));
    }

    sets.push({ armor, statChoices: processSet.statChoices });
  }

  const firstValidSet: DimItem[] = processed.firstValidSet.map((id) => itemsById[id]);

  return {
    sets,
    firstValidSet,
    firstValidSetStatChoices: processed.firstValidSetStatChoices,
    stats: processed.stats,
    maxPower: processed.maxPower,
  };
}
