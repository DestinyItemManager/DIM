import _ from 'lodash';
import { StatTypes } from './types';
import { DimPlug, DimItem, DimStat } from 'app/inventory/item-types';
import { getMasterworkSocketHashes } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';

export const statHashes: { [type in StatTypes]: number } = {
  Mobility: 2996146975,
  Resilience: 392767087,
  Recovery: 1943323491,
  Discipline: 1735777505,
  Intellect: 144602215,
  Strength: 4244567218,
};
export const statValues = Object.values(statHashes);
export const statKeys = Object.keys(statHashes) as StatTypes[];

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

  const statsByHash = _.keyBy(stats, (stat) => stat.statHash);
  const mixes: number[][] = [
    getBaseStatValues(statsByHash, item, assumeArmor2IsMasterwork, lockedModStats),
  ];

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
                const optionPlugValue = (plug.stats && plug.stats[statHash]) || 0;
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

function getBaseStatValues(
  stats: {
    [index: string]: DimStat;
  },
  item: DimItem,
  assumeMasterwork: boolean | null,
  lockedModStats: { [statHash: number]: number }
) {
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
