import {
  DestinyInventoryItemDefinition,
  DestinyStatDisplayDefinition,
  DestinyStatGroupDefinition,
  DestinyItemInvestmentStatDefinition,
  DestinyStatDefinition
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
  447667954, // Draw Time
  3614673599, // Blast Radius
  2523465841, // Velocity
  2837207746, // Swing Speed (sword)
  4043523819, // Impact
  1240592695, // Range
  2762071195, // Efficiency (sword)
  209426660, // Defense (sword)
  1591432999, // Accuracy
  155624089, // Stability
  943549884, // Handling
  4188031367, // Reload Speed
  1345609583, // Aim Assistance
  3555269338, // Zoom
  2715839340, // Recoil Direction
  3871231066, // Magazine
  1931675084, // Inventory Size
  925767036, // Ammo Capacity
  2996146975, // Mobility
  392767087, // Resilience
  1943323491 // Recovery
];

/** Stats that should be forced to display without a bar (just a number). */
const statsNoBar = [
  4284893193, // Rounds Per Minute
  3871231066, // Magazine
  2961396640, // Charge Time
  447667954, // Draw Time
  1931675084, // Recovery
  2715839340 // Recoil Direction
];

/** Stats that all armor should have. */
const armorStats = [
  1943323491, // Recovery
  392767087, // Resilience
  2996146975 // Mobility
];

/** Stats that are measured in milliseconds. */
export const statsMs = [
  447667954, // Draw Time
  2961396640 // Charge Time
];

/** Show these stats in addition to any "natural" stats */
const hiddenStatsWhitelist = [
  1345609583, // Aim Assistance
  3555269338, // Zoom
  2715839340 // Recoil Direction
];

/** Build the full list of stats for an item. If the item has no stats, this returns null. */
export function buildStats(
  createdItem: D2Item,
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
) {
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return null;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return null;
  }

  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);

  // We only use the raw "investment" stats to calculate all item stats.
  let investmentStats = buildInvestmentStats(itemDef, defs, statGroup, statDisplays) || [];

  // Include the contributions from perks and mods
  if (createdItem.sockets && createdItem.sockets.sockets.length) {
    investmentStats = enhanceStatsWithPlugs(
      itemDef,
      investmentStats,
      createdItem.sockets.sockets,
      defs,
      statGroup,
      statDisplays
    );
  }

  // Armor won't have stats it doesn't have any points in, so we need to
  // fill them in.
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

function shouldShowStat(
  itemDef: DestinyInventoryItemDefinition,
  statHash: number,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  // Bows have a charge time stat that nobody asked for
  if (
    statHash === 2961396640 &&
    itemDef.itemCategoryHashes &&
    itemDef.itemCategoryHashes.includes(3317538576)
  ) {
    return false;
  }

  // Swords shouldn't show any hidden stats
  const includeHiddenStats = !(
    itemDef.itemCategoryHashes && itemDef.itemCategoryHashes.includes(54)
  );

  return (
    // Must be on the whitelist
    statWhiteList.includes(statHash) &&
    // Must be on the list of interpolated stats, or included in the hardcoded hidden stats list
    (statDisplays[statHash] || (includeHiddenStats && hiddenStatsWhitelist.includes(statHash)))
  );
}

/**
 * Build stats from the non-pre-sized investment stats. Destiny stats come in two flavors - precalculated
 * by the API, and "investment stats" which are the raw game values. The latter must be transformed into
 * what you see in the game, but as a result you can see "hidden" stats at their true value, and calculate
 * the value that perks and mods contribute to the overall stat value.
 */
function buildInvestmentStats(
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
): DimStat[] | null {
  const itemStats = itemDef.investmentStats || [];

  return _.compact(
    Object.values(itemStats).map((itemStat): DimStat | undefined => {
      const statHash = itemStat.statTypeHash;
      if (!itemStat || !shouldShowStat(itemDef, statHash, statDisplays)) {
        return undefined;
      }

      const def = defs.Stat.get(statHash);
      if (!def) {
        return undefined;
      }

      return buildStat(itemStat, statGroup, def, statDisplays);
    })
  );
}

function buildStat(
  itemStat: DestinyItemInvestmentStatDefinition,
  statGroup: DestinyStatGroupDefinition,
  statDef: DestinyStatDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  const statHash = itemStat.statTypeHash;
  let value = itemStat.value || 0;
  let maximumValue = statGroup.maximumValue;
  let bar = !statsNoBar.includes(statHash);
  let smallerIsBetter = false;
  const statDisplay = statDisplays[statHash];
  if (statDisplay) {
    const firstInterp = statDisplay.displayInterpolation[0];
    const lastInterp =
      statDisplay.displayInterpolation[statDisplay.displayInterpolation.length - 1];
    smallerIsBetter = firstInterp.weight > lastInterp.weight;
    maximumValue = Math.max(statDisplay.maximumValue, firstInterp.weight, lastInterp.weight);
    bar = !statDisplay.displayAsNumeric;
    value = interpolateStatValue(value, statDisplay);
  }
  value = Math.max(0, value);

  return {
    investmentValue: itemStat.value || 0,
    statHash,
    displayProperties: statDef.displayProperties,
    sort: statWhiteList.indexOf(statHash),
    value,
    maximumValue,
    bar,
    smallerIsBetter
  };
}

function enhanceStatsWithPlugs(
  itemDef: DestinyInventoryItemDefinition,
  stats: DimStat[],
  sockets: DimSocket[],
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  const statsByHash = _.keyBy(stats, (s) => s.statHash);

  const modifiedStats = new Set<number>();

  // Add the chosen plugs' investment stats to the item's base investment stats
  for (const socket of sockets) {
    if (socket.plug) {
      for (const perkStat of socket.plug.plugItem.investmentStats) {
        const statHash = perkStat.statTypeHash;
        const itemStat = statsByHash[statHash];
        const value = perkStat.value || 0;
        if (itemStat) {
          itemStat.investmentValue += value;
        } else if (shouldShowStat(itemDef, statHash, statDisplays)) {
          // This stat didn't exist before we modified it, so add it here.
          const stat = socket.plug.plugItem.investmentStats.find(
            (s) => s.statTypeHash === statHash
          );

          if (stat && stat.value) {
            const statDef = defs.Stat.get(statHash);
            const builtStat = buildStat(stat, statGroup, statDef, statDisplays);
            statsByHash[statHash] = builtStat;
            stats.push(statsByHash[statHash]);
          }
        }
        modifiedStats.add(statHash);
      }
    }
  }

  // Now calculate the actual, interpolated value of all stats after they've been modified
  for (const stat of stats) {
    if (modifiedStats.has(stat.statHash)) {
      const statDisplay = statDisplays[stat.statHash];
      stat.value = statDisplay
        ? interpolateStatValue(stat.investmentValue, statDisplays[stat.statHash])
        : Math.min(stat.investmentValue, stat.maximumValue);
    }
  }

  // We sort the sockets by length so that we count contributions from plugs with fewer options first.
  // This is because multiple plugs can contribute to the same stat, so we want to sink the non-changeable
  // stats in first.
  const sortedSockets = _.sortBy(sockets, (s) => s.plugOptions.length);
  for (const socket of sortedSockets) {
    for (const plug of socket.plugOptions) {
      if (plug.plugItem && plug.plugItem.investmentStats && plug.plugItem.investmentStats.length) {
        plug.stats = buildPlugStats(plug, statsByHash, statDisplays);
      }
    }
  }

  return stats;
}

/**
 * For each stat this plug modified, calculate how much it modifies that stat.
 *
 * Returns a map from stat hash to stat value.
 */
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
      // This is a scaled stat, so we need to scale it in context of the original investment stat.
      // Figure out what the interpolated stat value would be without this perk's contribution, and
      // then take the difference between the total value and that to find the contribution.
      const valueWithoutPerk = interpolateStatValue(itemStat.investmentValue - value, statDisplay);
      value = itemStat.value - valueWithoutPerk;
    } else if (itemStat) {
      const valueWithoutPerk = Math.min(itemStat.investmentValue - value, itemStat.maximumValue);
      value = itemStat.value - valueWithoutPerk;
    }
    stats[perkStat.statTypeHash] = value;
  }

  return stats;
}

/**
 * Armor won't have stats it doesn't have any points in, so we need to fill them in
 * based on a hardcoded list.
 */
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
      const statDef = defs.Stat.get(statHash);
      const stat = buildStat(
        { statTypeHash: statHash, value: 0, isConditionallyActive: false },
        statGroup,
        statDef,
        statDisplays
      );
      investmentStats.push(stat);
    }
  }

  return investmentStats;
}

/**
 * Some stats have an item-specific interpolation table, which is defined as
 * a piecewise linear function mapping input stat values to output stat values.
 */
function interpolateStatValue(value: number, statDisplay: DestinyStatDisplayDefinition) {
  const interp = statDisplay.displayInterpolation;

  // Clamp the value to prevent overfilling
  value = Math.max(0, Math.min(value, statDisplay.maximumValue));

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
