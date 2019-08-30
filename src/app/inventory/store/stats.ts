import {
  DestinyInventoryItemDefinition,
  DestinyStatDisplayDefinition
} from 'bungie-api-ts/destiny2';
import { DimStat, D2Item, DimSocket, DimPlug } from '../item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { compareBy } from 'app/comparators';
import _ from 'lodash';

/**
 * These are the utilities that deal with Stats on items - specifically, how to calculate them.
 *
 * This is called from within d2-item-factory.service.ts
 */

/**
 * Which stats to display, and in which order.
 */
export const statWhiteList = [
  4284893193, // Rounds Per Minute
  2961396640, // Charge Time
  3614673599, // Blast Radius
  2523465841, // Velocity
  4043523819, // Impact
  1240592695, // Range
  155624089, // Stability
  943549884, // Handling
  4188031367, // Reload Speed
  1345609583, // Aim Assistance
  3555269338, // Zoom
  2715839340, // Recoil Direction
  3871231066, // Magazine
  2996146975, // Mobility
  392767087, // Resilience
  1943323491, // Recovery
  447667954 // Draw Time
  //    1935470627, // Power
  // there are a few others (even an `undefined` stat)
];

/** Stats that should be displayed without a bar (just a number) */
const statsNoBar = [
  /*
  4284893193, // Rounds Per Minute
  3871231066, // Magazine
  2961396640, // Charge Time
  447667954, // Draw Time
  1931675084, // Inventory Size
  */
  2715839340 // Recoil Direction
];

/** Stats that all armor should have. */
const armorStats = [
  1943323491, // Recovery
  392767087, // Resilience
  2996146975 // Mobility
];

/** Built the full list of stats for an item. If the item has no stats, this returns null. */
export function buildStats(
  createdItem: D2Item,
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
) {
  let investmentStats = buildInvestmentStats(itemDef, defs) || [];
  if (createdItem.sockets && createdItem.sockets.sockets.length) {
    investmentStats = enhanceStatsWithPlugs(
      investmentStats,
      createdItem.sockets.sockets,
      itemDef,
      defs
    );
  }
  if (
    investmentStats.length &&
    createdItem.bucket.inArmor &&
    itemDef.stats &&
    itemDef.stats.statGroupHash
  ) {
    investmentStats = fillInArmorStats(investmentStats, itemDef, defs);
  }

  return investmentStats.length ? investmentStats.sort(compareBy((s) => s.sort)) : null;
}

// TODO: not for cloaks though...
function fillInArmorStats(
  investmentStats: DimStat[],
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
) {
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return investmentStats;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return investmentStats;
  }

  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);
  for (const statHash of armorStats) {
    if (!investmentStats.some((s) => s.statHash === statHash)) {
      const def = defs.Stat.get(statHash);
      let value = 0;
      let maximumValue = statGroup.maximumValue;
      let bar = !statsNoBar.includes(statHash);
      const statDisplay = statDisplays[statHash];
      if (statDisplay) {
        maximumValue = statDisplay.maximumValue;
        bar = !statDisplay.displayAsNumeric;
        value = interpolateStatValue(value, statDisplay);
      }
      value = Math.min(Math.max(0, value), maximumValue);

      investmentStats.push({
        investmentValue: 0,
        statHash,
        // TODO: replace with displayProperties
        name: def.displayProperties.name,
        sort: statWhiteList.indexOf(statHash),
        value,
        maximumValue,
        bar
      });
    }
  }

  return investmentStats;
}

/**
 * Build stats from the non-pre-sized investment stats.
 */
function buildInvestmentStats(
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
): DimStat[] | null {
  const itemStats = itemDef.investmentStats || [];
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return null;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return null;
  }

  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);

  // TODO: loadout optimizer is only counting bonuses from switchable perks

  return _.compact(
    Object.values(itemStats).map((itemStat): DimStat | undefined => {
      const statHash = itemStat.statTypeHash;
      if (!itemStat || !statWhiteList.includes(statHash)) {
        return undefined;
      }

      const def = defs.Stat.get(statHash);
      if (!def) {
        return undefined;
      }

      // TODO: extract this stat-building code
      let value = itemStat.value || 0;
      let maximumValue = statGroup.maximumValue;
      let bar = !statsNoBar.includes(statHash);
      const statDisplay = statDisplays[statHash];
      if (statDisplay) {
        maximumValue = statDisplay.maximumValue;
        bar = !statDisplay.displayAsNumeric;
        value = interpolateStatValue(value, statDisplay);
      }
      value = Math.min(Math.max(0, value), maximumValue);

      return {
        investmentValue: itemStat.value || 0,
        statHash,
        // TODO: replace with displayProperties
        name: def.displayProperties.name,
        sort: statWhiteList.indexOf(statHash),
        value,
        maximumValue,
        bar
      };
    })
  );
}

function interpolateStatValue(value: number, statDisplay: DestinyStatDisplayDefinition) {
  // Some stats have an item-specific interpolation table, which is defined as
  // a piecewise linear function mapping input stat values to output stat values.
  const interp = statDisplay.displayInterpolation;
  let endIndex = interp.findIndex((p) => p.value > value);
  if (endIndex < 0) {
    endIndex = interp.length - 1;
  }
  const startIndex = Math.max(0, endIndex - 1);

  const start = interp[startIndex];
  const end = interp[endIndex];
  const range = end.value - start.value;
  if (range === 0) {
    return start.weight;
  }

  const t = (value - start.value) / (end.value - start.value);

  return Math.round(start.weight + t * (end.weight - start.weight));
}

function enhanceStatsWithPlugs(
  stats: DimStat[],
  sockets: DimSocket[],
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
) {
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return stats;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return stats;
  }

  // TODO: calculate this once...
  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);
  const statsByHash = _.keyBy(stats, (s) => s.statHash);

  // Add the chosen plugs' investment stats to the item's base investment stats
  for (const socket of sockets) {
    if (socket.plug) {
      for (const perkStat of socket.plug.plugItem.investmentStats) {
        const statHash = perkStat.statTypeHash;
        const itemStat = statsByHash[statHash];
        const value = perkStat.value || 0;
        if (itemStat) {
          itemStat.investmentValue += value;
        } else if (statWhiteList.includes(statHash)) {
          // This stat didn't exist before we modified it, so add it here.
          const stat = socket.plug.plugItem.investmentStats.find(
            (s) => s.statTypeHash === statHash
          );

          if (stat && stat.value) {
            let maximumValue = statGroup.maximumValue;
            let bar = !statsNoBar.includes(statHash);
            const statDisplay = statDisplays[statHash];
            if (statDisplay) {
              maximumValue = statDisplay.maximumValue;
              bar = !statDisplay.displayAsNumeric;
            }

            statsByHash[statHash] = {
              investmentValue: stat.value || 0,
              value,
              statHash,
              name: defs.Stat.get(statHash).displayProperties.name,
              sort: statWhiteList.indexOf(statHash),
              maximumValue,
              bar
            };

            stats.push(statsByHash[statHash]);
          }
        }
      }
    }
  }

  for (const stat of stats) {
    const statDisplay = statDisplays[stat.statHash];
    stat.value = statDisplay
      ? interpolateStatValue(stat.investmentValue, statDisplays[stat.statHash])
      : stat.investmentValue;
  }

  // We sort the sockets by length so that we count contributions from plugs with fewer options first.
  // This is because multiple plugs can contribute to the same stat, so we want to sink the non-changeable
  // stats in first.
  const sortedSockets = _.sortBy(sockets, (s) => s.plugOptions.length);

  for (const socket of sortedSockets) {
    for (const plug of socket.plugOptions) {
      if (plug.plugItem && plug.plugItem.investmentStats && plug.plugItem.investmentStats.length) {
        plug.stats = buildPlugStats(plug, statsByHash, statDisplays);

        if (plug === socket.plug) {
          _.forIn(plug.stats, (value, statHashStr) => {
            const statHash = parseInt(statHashStr, 10);
            const itemStat = statsByHash[statHash];
            if (!itemStat) {
              if (statWhiteList.includes(statHash)) {
                // This stat didn't exist before we modified it, so add it here.
                const stat = plug.plugItem.investmentStats.find((s) => s.statTypeHash === statHash);

                if (stat && stat.value) {
                  let maximumValue = statGroup.maximumValue;
                  let bar = !statsNoBar.includes(statHash);
                  const statDisplay = statDisplays[statHash];
                  if (statDisplay) {
                    maximumValue = statDisplay.maximumValue;
                    bar = !statDisplay.displayAsNumeric;
                  }

                  statsByHash[statHash] = {
                    investmentValue: stat.value || 0,
                    value,
                    statHash,
                    name: defs.Stat.get(statHash).displayProperties.name,
                    sort: statWhiteList.indexOf(statHash),
                    maximumValue,
                    bar
                  };

                  stats.push(statsByHash[statHash]);
                }
              }
            } else {
              itemStat.value = Math.min(Math.max(0, itemStat.value), itemStat.maximumValue);
            }
          });
        }
      }
    }
  }

  return stats;
}

function buildPlugStats(
  plug: DimPlug,
  statsByHash: { [statHash: number]: DimStat },
  statDisplays: { [statHash: number]: DestinyStatDisplayDefinition }
) {
  const stats: {
    [statHash: number]: number;
  } = {};

  for (const perkStat of plug.plugItem.investmentStats) {
    let value = perkStat.value || 0;
    const itemStat = statsByHash[perkStat.statTypeHash];
    const statDisplay = statDisplays[perkStat.statTypeHash];
    if (itemStat && statDisplay) {
      // This is a scaled stat, so we need to scale it in context of the original investment stat
      const valueWithoutPerk = interpolateStatValue(itemStat.investmentValue - value, statDisplay);
      value = itemStat.value - valueWithoutPerk;
    }
    stats[perkStat.statTypeHash] = value;
  }

  return stats;
}
