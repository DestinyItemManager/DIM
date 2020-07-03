import _ from 'lodash';
import { DimPlug, DimItem } from 'app/inventory/item-types';
import { getMasterworkSocketHashes } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { statValues, LockedItemType, LockedArmor2Mod } from './types';

/**
 * This is a wrapper for the awkward helper used by
 * GeneratedSetItem#identifyAltPerkChoicesForChosenStats. It figures out which perks need
 * to be selected to get that stat mix.
 *
 * It assumes we're looking for perks, not mixes, and keeps track of what perks are necessary
 * to fulfill a stat-mix, and the callback stops the function early. This is like this
 * so we can share this complicated bit of logic and not get it out of sync.
 */
export function generateMixesFromPerks(
  item: DimItem,
  lockedModStats: { [statHash: number]: number },
  onMix: (mix: number[], plug: DimPlug[] | null) => boolean
) {
  return generateMixesFromPerksOrStats(item, null, lockedModStats, onMix);
}

/**
 * This is an awkward helper used by both byStatMix (to generate the list of
 * stat mixes) and GeneratedSetItem#identifyAltPerkChoicesForChosenStats. It figures out
 * which perks need to be selected to get that stat mix or in the case of Armour 2.0, it
 * calculates them directly from the stats.
 *
 * It has two modes depending on whether an "onMix" callback is provided - if it is, it
 * assumes we're looking for perks, not mixes, and keeps track of what perks are necessary
 * to fulfill a stat-mix, and lets the callback stop the function early. If not, it just
 * returns all the mixes. This is like this so we can share this complicated bit of logic
 * and not get it out of sync.
 */
export function generateMixesFromPerksOrStats(
  item: DimItem,
  assumeArmor2IsMasterwork: boolean | null,
  lockedModStats: { [statHash: number]: number },
  /** Callback when a new mix is found. */
  onMix?: (mix: number[], plug: DimPlug[] | null) => boolean
) {
  const stats = item.stats;

  if (!stats || stats.length < 3) {
    return [];
  }

  const mixes: number[][] = [getBaseStatValues(item, assumeArmor2IsMasterwork, lockedModStats)];

  const altPerks: (DimPlug[] | null)[] = [null];

  if (stats && item.isDestiny2() && item.sockets && !item.energy) {
    for (const socket of item.sockets.sockets) {
      if (socket.plugOptions.length > 1) {
        for (const plug of socket.plugOptions) {
          if (plug !== socket.plug && plug.stats) {
            // Stats without the currently selected plug, with the optional plug
            const mixNum = mixes.length;
            for (let mixIndex = 0; mixIndex < mixNum; mixIndex++) {
              const existingMix = mixes[mixIndex];
              const optionStat = statValues.map((statHash, index) => {
                const currentPlugValue = (socket.plug?.stats && socket.plug.stats[statHash]) ?? 0;
                const optionPlugValue = plug.stats?.[statHash] || 0;
                return existingMix[index] - currentPlugValue + optionPlugValue;
              });

              if (onMix) {
                const existingMixAlts = altPerks[mixIndex];
                const plugs = existingMixAlts ? [...existingMixAlts, plug] : [plug];
                altPerks.push(plugs);
                if (!onMix(optionStat, plugs)) {
                  return [];
                }
              }
              mixes.push(optionStat);
            }
          }
        }
      }
    }
  }

  return mixes;
}

export function getBaseStatValues(
  item: DimItem,
  assumeMasterwork: boolean | null,
  lockedModStats: { [statHash: number]: number }
) {
  const stats = _.keyBy(item.stats, (stat) => stat.statHash);
  const baseStats = {};

  for (const statHash of statValues) {
    baseStats[statHash] = stats[statHash].value;
  }

  // Checking energy tells us if it is Armour 2.0
  if (item.isDestiny2() && item.sockets && item.energy) {
    let masterworkSocketHashes: number[] = [];

    // only get masterwork sockets if we aren't manually adding the values
    if (!assumeMasterwork) {
      masterworkSocketHashes = getMasterworkSocketHashes(
        item.sockets,
        DestinySocketCategoryStyle.EnergyMeter
      );
    }

    for (const socket of item.sockets.sockets) {
      const plugHash = socket?.plug?.plugItem?.hash ?? NaN;

      if (socket.plug?.stats && !masterworkSocketHashes.includes(plugHash)) {
        for (const statHash of statValues) {
          if (socket.plug.stats[statHash]) {
            baseStats[statHash] -= socket.plug.stats[statHash];
          }
        }
      }
    }

    if (assumeMasterwork) {
      for (const statHash of statValues) {
        baseStats[statHash] += 2;
      }
    }
    // For Armor 2.0 mods, include the stat values of any locked mods in the item's stats
    _.forIn(lockedModStats, (value, statHash) => {
      baseStats[statHash] += value;
    });
  }
  // mapping out from stat values to ensure ordering and that values don't fall below 0 from locked mods
  return statValues.map((statHash) => Math.max(baseStats[statHash], 0));
}

/**
 * Get the stats totals attributed to locked mods. Note that these are stats from mods in a single bucket, head, arms, ect.
 */
export function getLockedModStats(
  lockedItems?: readonly LockedItemType[],
  lockedArmor2Mods?: readonly LockedArmor2Mod[]
): { [statHash: number]: number } {
  const lockedModStats: { [statHash: number]: number } = {};
  // Handle old armour mods
  if (lockedItems) {
    for (const lockedItem of lockedItems) {
      if (lockedItem.type === 'mod') {
        for (const stat of lockedItem.mod.investmentStats) {
          lockedModStats[stat.statTypeHash] = lockedModStats[stat.statTypeHash] || 0;
          // TODO This is no longer accurate, see https://github.com/DestinyItemManager/DIM/wiki/DIM's-New-Stat-Calculations
          lockedModStats[stat.statTypeHash] += stat.value;
        }
      }
    }
  }

  // Handle armour 2.0 mods
  if (lockedArmor2Mods) {
    for (const lockedMod of lockedArmor2Mods) {
      for (const stat of lockedMod.mod.investmentStats) {
        lockedModStats[stat.statTypeHash] = lockedModStats[stat.statTypeHash] || 0;
        // TODO This is no longer accurate, see https://github.com/DestinyItemManager/DIM/wiki/DIM's-New-Stat-Calculations
        lockedModStats[stat.statTypeHash] += stat.value;
      }
    }
  }

  return lockedModStats;
}
