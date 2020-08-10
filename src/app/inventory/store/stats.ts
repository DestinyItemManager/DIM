import {
  DestinyInventoryItemDefinition,
  DestinyStatDisplayDefinition,
  DestinyStatGroupDefinition,
  DestinyItemInvestmentStatDefinition,
  DestinyStatDefinition,
  DestinyItemStatsComponent,
  DestinyDisplayPropertiesDefinition,
  DestinyStatAggregationType,
  DestinyStatCategory,
  DestinySocketCategoryStyle,
  DestinyClass,
} from 'bungie-api-ts/destiny2';
import { D2Item, DimSocket, DimPlug, DimStat, DimSockets } from '../item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { getSocketsWithStyle, getSocketsWithPlugCategoryHash } from '../../utils/socket-utils';
import {
  armorBuckets,
  ARMOR_STAT_CAP,
  TOTAL_STAT_HASH,
  CUSTOM_TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { D1ItemCategoryHashes } from 'app/search/d1-known-values';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import reduxStore from '../../store/store';
import { settingsSelector } from 'app/settings/reducer';

/**
 * These are the utilities that deal with Stats on items - specifically, how to calculate them.
 *
 * This is called from within d2-item-factory.service.ts
 *
 * the process looks like this:
 *
 * buildStats(stats){
 *  stats = buildInvestmentStats(stats)                       // fancy gun math based on fixed info
 *  if (sockets) stats = enhanceStatsWithPlugs(stats){}       // enhance gun math with sockets
 *  if (no stats or is armor) stats = buildLiveStats(stats){} // just rely on what api tells us
 *  if (is armor) stats = buildBaseStats(stats){}             // determine what mods contributed
 *  if (is armor) stats.push(total)
 * }
 */

/** Stats that all armor should have. */
export const armorStats = [
  StatHashes.Mobility,
  StatHashes.Resilience,
  StatHashes.Recovery,
  StatHashes.Discipline,
  StatHashes.Intellect,
  StatHashes.Strength,
];

/**
 * Which stats to display, and in which order.
 */
export const statAllowList = [
  StatHashes.RoundsPerMinute,
  StatHashes.ChargeTime,
  StatHashes.DrawTime,
  StatHashes.BlastRadius,
  StatHashes.Velocity,
  StatHashes.SwingSpeed,
  StatHashes.Impact,
  StatHashes.Range,
  StatHashes.GuardEfficiency,
  StatHashes.GuardResistance,
  StatHashes.Accuracy,
  StatHashes.Stability,
  StatHashes.Handling,
  StatHashes.ChargeRate,
  StatHashes.GuardEndurance,
  StatHashes.ReloadSpeed,
  StatHashes.AimAssistance,
  StatHashes.Zoom,
  StatHashes.RecoilDirection,
  StatHashes.Magazine,
  StatHashes.InventorySize,
  StatHashes.AmmoCapacity,
  ...armorStats,
  TOTAL_STAT_HASH,
  CUSTOM_TOTAL_STAT_HASH,
];

/** Stats that are measured in milliseconds. */
export const statsMs = [StatHashes.DrawTime, StatHashes.ChargeTime];

/** Stats that should be forced to display without a bar (just a number). */
const statsNoBar = [
  StatHashes.RoundsPerMinute,
  StatHashes.Magazine,
  StatHashes.InventorySize,
  StatHashes.RecoilDirection,
  ...statsMs,
];

/** Show these stats in addition to any "natural" stats */
const hiddenStatsAllowList = [
  StatHashes.AimAssistance,
  StatHashes.Zoom,
  StatHashes.RecoilDirection,
];

/** Build the full list of stats for an item. If the item has no stats, this returns null. */
export function buildStats(
  createdItem: D2Item,
  stats: {
    [key: string]: DestinyItemStatsComponent;
  } | null,
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
  let investmentStatsByHash = _.keyBy(investmentStats, (s) => s.statHash);

  // Include the contributions from perks and mods
  if (createdItem.sockets?.allSockets.length) {
    enhanceStatsWithPlugs(
      itemDef,
      investmentStats,
      investmentStatsByHash,
      createdItem.sockets.allSockets,
      defs,
      statGroup,
      statDisplays
    );
  }

  // For Armor, we always replace the previous stats with live stats, even if they were already created
  if ((!investmentStats.length || createdItem.bucket.inArmor) && stats?.[createdItem.id]) {
    // TODO: build a version of enhanceStatsWithPlugs that only calculates plug values
    investmentStats = buildLiveStats(stats[createdItem.id], itemDef, defs, statGroup, statDisplays);
    investmentStatsByHash = _.keyBy(investmentStats, (s) => s.statHash);

    if (createdItem.bucket.inArmor) {
      buildBaseStats(investmentStats, investmentStatsByHash, createdItem);

      // Add the "Total" stat for armor
      const tStat = totalStat(investmentStats);
      investmentStats.push(tStat);

      const cStat = customStat(investmentStats, createdItem.classType);
      if (cStat) {
        investmentStats.push(cStat);
      }
    }
  } else if (
    createdItem.isDestiny2() &&
    createdItem.type === 'ClassItem' &&
    createdItem.energy &&
    createdItem.sockets
  ) {
    investmentStats = buildStatsFromMods(createdItem.sockets, defs, statGroup, statDisplays);
  }

  return investmentStats.length ? investmentStats.sort(compareBy((s) => s.sort)) : null;
}

function buildStatsFromMods(
  itemSockets: DimSockets,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
): DimStat[] {
  const statTracker: { stat: number; value: number } | {} = {};
  const investmentStats: DimStat[] = [];
  const modSockets = getSocketsWithPlugCategoryHash(itemSockets, ItemCategoryHashes.ArmorMods);
  const masterworkSockets = getSocketsWithStyle(
    itemSockets,
    DestinySocketCategoryStyle.EnergyMeter
  );

  for (const statHash of armorStats) {
    statTracker[statHash] = 0;
  }

  // there should only be one masterwork socket
  if (masterworkSockets.length) {
    modSockets.push(masterworkSockets[0]);
  }

  for (const socket of modSockets) {
    if (socket?.plugged?.stats) {
      for (const statHash of armorStats) {
        if (socket.plugged.stats[statHash]) {
          statTracker[statHash] += socket.plugged.stats[statHash];
        }
      }
    }
  }

  for (const statHash of armorStats) {
    const hashAndValue = {
      statTypeHash: statHash,
      value: statTracker[statHash],
    };
    const builtStat = buildStat(hashAndValue, statGroup, defs.Stat.get(statHash), statDisplays);
    builtStat.maximumValue = ARMOR_STAT_CAP;
    investmentStats.push(builtStat);
  }

  investmentStats.push(totalStat(investmentStats));

  return investmentStats;
}

function shouldShowStat(
  itemDef: DestinyInventoryItemDefinition,
  statHash: number,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  // Bows have a charge time stat that nobody asked for
  if (
    statHash === StatHashes.ChargeTime &&
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Bows)
  ) {
    return false;
  }

  // Swords shouldn't show any hidden stats
  const includeHiddenStats = !itemDef.itemCategoryHashes?.includes(D1ItemCategoryHashes.sword);

  return (
    // Must be on the AllowList
    statAllowList.includes(statHash) &&
    // Must be on the list of interpolated stats, or included in the hardcoded hidden stats list
    (statDisplays[statHash] || (includeHiddenStats && hiddenStatsAllowList.includes(statHash)))
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

  const ret: DimStat[] = [];
  for (const itemStat of itemStats) {
    const statHash = itemStat.statTypeHash;
    if (!itemStat || !shouldShowStat(itemDef, statHash, statDisplays)) {
      continue;
    }

    const def = defs.Stat.get(statHash);
    if (!def) {
      continue;
    }

    ret.push(buildStat(itemStat, statGroup, def, statDisplays));
  }

  return ret;
}

function buildStat(
  itemStat: DestinyItemInvestmentStatDefinition | { statTypeHash: number; value: number },
  statGroup: DestinyStatGroupDefinition,
  statDef: DestinyStatDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
): DimStat {
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

  return {
    investmentValue: itemStat.value || 0,
    statHash,
    displayProperties: statDef.displayProperties,
    sort: statAllowList.indexOf(statHash),
    value,
    base: value,
    maximumValue,
    bar,
    smallerIsBetter,
    // Only set additive for defense stats, because for some reason Zoom is
    // set to use DestinyStatAggregationType.Character
    additive:
      statDef.statCategory === DestinyStatCategory.Defense &&
      statDef.aggregationType === DestinyStatAggregationType.Character,
  };
}

function enhanceStatsWithPlugs(
  itemDef: DestinyInventoryItemDefinition,
  stats: DimStat[], // mutated
  statsByHash: { [k: number]: DimStat }, // mutated
  sockets: DimSocket[],
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  const modifiedStats = new Set<number>();

  // Add the chosen plugs' investment stats to the item's base investment stats
  for (const socket of sockets) {
    if (socket.plugged?.plugDef.investmentStats) {
      for (const perkStat of socket.plugged.plugDef.investmentStats) {
        const statHash = perkStat.statTypeHash;
        const itemStat = statsByHash[statHash];
        const value = perkStat.value || 0;
        if (itemStat) {
          itemStat.investmentValue += value;
        } else if (shouldShowStat(itemDef, statHash, statDisplays)) {
          // This stat didn't exist before we modified it, so add it here.
          const stat = socket.plugged.plugDef.investmentStats.find(
            (s) => s.statTypeHash === statHash
          );

          if (stat?.value) {
            const statDef = defs.Stat.get(statHash);
            statsByHash[statHash] = buildStat(stat, statGroup, statDef, statDisplays);
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
      if (plug.plugDef?.investmentStats?.length) {
        plug.stats = buildPlugStats(plug, statsByHash, statDisplays);
      }
    }
  }
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

  for (const perkStat of plug.plugDef.investmentStats) {
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
 * Build the stats that come "live" from the API's data on real instances. This is required
 * for Armor 2.0 since it has random stat rolls.
 */
function buildLiveStats(
  stats: DestinyItemStatsComponent,
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  const ret: DimStat[] = [];

  for (const itemStatKey in stats.stats) {
    const itemStat = stats.stats[itemStatKey];

    const statHash = itemStat.statHash;
    if (!itemStat || !shouldShowStat(itemDef, statHash, statDisplays)) {
      continue;
    }

    const statDef = defs.Stat.get(statHash);
    if (!statDef) {
      continue;
    }

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
    }

    ret.push({
      investmentValue: itemStat.value || 0,
      statHash,
      displayProperties: statDef.displayProperties,
      sort: statAllowList.indexOf(statHash),
      value: itemStat.value,
      base: itemStat.value,
      maximumValue,
      bar,
      smallerIsBetter,
      additive: statDef.aggregationType === DestinyStatAggregationType.Character,
    });
  }

  return ret;
}

/**
 * THIS RELIES ON BEING RUN FOLLOWING buildLiveStats, and runs only for armor
 *
 * this assumes unenriched live stats, single values based off API reported stats
 * it takes .base, currently equal to .value, and adjusts it down to make a de-adjusted value
 * representing the raw armor stats before mods changed them
 */
function buildBaseStats(
  stats: DimStat[], //mutated
  statsByHash: { [k: number]: DimStat }, // mutated, same as above but keyed by hash
  item: D2Item
) {
  // Class Items always have a base stat of 0;
  if (item.bucket.hash === armorBuckets.classitem) {
    for (const stat of stats) {
      stat.base = 0;
    }
  } else if (item.sockets?.allSockets.length) {
    for (const socket of item.sockets.allSockets) {
      if (socket.plugged?.plugDef.investmentStats) {
        for (const perkStat of socket.plugged.plugDef.investmentStats) {
          const statHash = perkStat.statTypeHash;
          const itemStat = statsByHash[statHash];
          const perkValue = perkStat.value || 0;
          if (itemStat && itemStat.base > perkValue) {
            itemStat.base -= perkValue;
          }
          if (
            (itemStat && itemStat.investmentValue === 0 && perkValue < 0) ||
            perkStat.isConditionallyActive
          ) {
            itemStat.baseMayBeWrong = true;
          }
        }
      }
    }
  }
}

function totalStat(stats: DimStat[]): DimStat {
  // TODO: for loop
  // TODO: base only
  // TODO: search terms?
  const total = _.sumBy(stats, (s) => s.value);
  const baseTotal = _.sumBy(stats, (s) => s.base);
  const baseMayBeWrong = stats.some((stat) => stat.baseMayBeWrong);
  return {
    investmentValue: total,
    statHash: TOTAL_STAT_HASH,
    displayProperties: ({
      name: t('Stats.Total'),
    } as any) as DestinyDisplayPropertiesDefinition,
    sort: statAllowList.indexOf(TOTAL_STAT_HASH),
    value: total,
    base: baseTotal,
    baseMayBeWrong,
    maximumValue: 100,
    bar: false,
    smallerIsBetter: false,
    additive: false,
  };
}

function customStat(stats: DimStat[], destinyClass: DestinyClass): DimStat | undefined {
  const customStatDef = settingsSelector(reduxStore.getState()).customTotalStatsByClass[
    destinyClass
  ];

  if (!customStatDef || customStatDef.length === 0 || customStatDef.length === 6) {
    return undefined;
  }

  // TODO: for loop
  // Custom stat is always base stat
  stats = stats.filter((s) => customStatDef.includes(s.statHash));
  const total = _.sumBy(stats, (s) => s.base);
  const baseTotal = total;
  const baseMayBeWrong = stats.some((stat) => stat.baseMayBeWrong);
  return {
    investmentValue: total,
    statHash: CUSTOM_TOTAL_STAT_HASH,
    displayProperties: ({
      name: t('Stats.Custom'),
      description: t('Stats.CustomDesc'),
    } as any) as DestinyDisplayPropertiesDefinition,
    sort: statAllowList.indexOf(CUSTOM_TOTAL_STAT_HASH),
    value: total,
    base: baseTotal,
    baseMayBeWrong,
    maximumValue: 100,
    bar: false,
    smallerIsBetter: false,
    additive: false,
  };
}

/**
 * Some stats have an item-specific interpolation table, which is defined as
 * a piecewise linear function mapping input stat values to output stat values.
 */
export function interpolateStatValue(value: number, statDisplay: DestinyStatDisplayDefinition) {
  const interp = statDisplay.displayInterpolation;

  // Clamp the value to prevent overfilling
  value = Math.min(value, statDisplay.maximumValue);

  let endIndex = interp.findIndex((p) => p.value > value);

  // value < 0 is for mods with negative stats
  if (endIndex < 0 || (value < 0 && armorStats.includes(statDisplay.statHash))) {
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

  const interpValue = start.weight + t * (end.weight - start.weight);

  // vthorn has a hunch that magazine size doesn't use banker's rounding, but the rest definitely do:
  // https://github.com/Bungie-net/api/issues/1029#issuecomment-531849137
  return statDisplay.statHash === StatHashes.Magazine
    ? Math.round(interpValue)
    : bankersRound(interpValue);
}

/**
 * "Banker's rounding" rounds numbers that perfectly fall halfway between two integers to the nearest
 * even integer, instead of always rounding up.
 */
function bankersRound(x: number) {
  const r = Math.round(x);
  return (x > 0 ? x : -x) % 1 === 0.5 ? (0 === r % 2 ? r : r - 1) : r;
}
