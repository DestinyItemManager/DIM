import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { D1ItemCategoryHashes } from 'app/search/d1-known-values';
import {
  armorBuckets,
  armorStats,
  ARMOR_STAT_DISPLAY_CAP,
  CUSTOM_TOTAL_STAT_HASH,
  TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { isPlugStatActive } from 'app/utils/item-utils';
import {
  DestinyClass,
  DestinyDisplayPropertiesDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemInvestmentStatDefinition,
  DestinyItemStatsComponent,
  DestinySocketCategoryStyle,
  DestinyStatAggregationType,
  DestinyStatCategory,
  DestinyStatDefinition,
  DestinyStatDisplayDefinition,
  DestinyStatGroupDefinition,
} from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import reduxStore from '../../store/store';
import { getSocketsWithPlugCategoryHash, getSocketsWithStyle } from '../../utils/socket-utils';
import { DimItem, DimSocket, DimStat } from '../item-types';

/**
 * These are the utilities that deal with Stats on items - specifically, how to calculate them.
 *
 * This is called from within d2-item-factory.service.ts
 *
 * the process looks like this:
 *
 * buildStats(stats){
 *  stats = buildInvestmentStats(stats)                       // fancy gun math based on fixed info
 *  if (sockets) stats = applyPlugsToStats(stats){}       // enhance gun math with sockets
 *  if (no stats or is armor) stats = buildLiveStats(stats){} // just rely on what api tells us
 *  if (is armor) stats = buildBaseStats(stats){}             // determine what mods contributed
 *  if (is armor) stats.push(total)
 * }
 */

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
  createdItem: DimItem,
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

  // we re-use this dictionary a bunch of times in subsequent
  // functions to speed up display info lookups
  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);

  // We only use the raw "investment" stats to calculate all item stats.
  // to-do: build armor stats with investment stats from socketed intrinsic plugs
  let investmentStats = buildInvestmentStats(itemDef, defs, statGroup, statDisplays) || [];

  // Include the contributions from perks and mods
  applyPlugsToStats(itemDef, investmentStats, createdItem, defs, statGroup, statDisplays);

  // For Armor, we always replace the previous stats with live stats, even if they were already created
  // to-do: don't do this
  if (
    (!investmentStats.length || createdItem.bucket.inArmor) &&
    stats?.[createdItem.id] &&
    createdItem.type !== 'ClassItem'
  ) {
    // TODO: build a version of applyPlugsToStats that only calculates plug values
    investmentStats = buildLiveStats(
      stats[createdItem.id],
      itemDef,
      createdItem,
      defs,
      statGroup,
      statDisplays
    );

    if (createdItem.bucket.inArmor) {
      // synthesize the "Total" stat for armor
      const tStat = totalStat(investmentStats);
      investmentStats.push(tStat);

      const cStat = customStat(investmentStats, createdItem.classType);
      if (cStat) {
        investmentStats.push(cStat);
      }
    }
  }

  // Always build class item stats directly from the mods as we know the base stat values.
  if (createdItem.type === 'ClassItem' && createdItem.energy && createdItem.sockets) {
    investmentStats = buildClassItemStatsFromMods(createdItem, defs, statGroup, statDisplays);
  }

  return investmentStats.length ? investmentStats.sort(compareBy((s) => s.sort)) : null;
}

/**
 * This builds a class item's stat values from its masterwork and mod sockets.
 * to-do: can we get rid of this once we aren't using Live Stats for armor?
 */
function buildClassItemStatsFromMods(
  item: DimItem,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
): DimStat[] {
  const statTracker: { stat: number; value: number } | {} = {};
  const investmentStats: DimStat[] = [];
  const modSockets = item.sockets
    ? getSocketsWithPlugCategoryHash(item.sockets, ItemCategoryHashes.ArmorMods)
    : [];
  const masterworkSockets = item.sockets
    ? getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.EnergyMeter)
    : [];

  for (const statHash of armorStats) {
    statTracker[statHash] = 0;
  }

  // there should only be one masterwork socket
  if (masterworkSockets.length) {
    modSockets.push(masterworkSockets[0]);
  }

  for (const socket of modSockets) {
    // skip this socket/plug if it wouldn't or shouldn't affect stats
    if (!socket.plugged?.enabled || !socket.plugged.stats) {
      continue;
    }
    for (const statHash of armorStats) {
      const investmentStat = socket.plugged.plugDef.investmentStats.find(
        (s) => s.statTypeHash === statHash
      );
      if (
        socket.plugged.stats[statHash] &&
        investmentStat &&
        isPlugStatActive(
          item,
          socket.plugged.plugDef.hash,
          investmentStat.statTypeHash,
          investmentStat.isConditionallyActive
        )
      ) {
        statTracker[statHash] += socket.plugged.stats[statHash];
      }
    }
  }

  for (const statHash of armorStats) {
    const hashAndValue = {
      statTypeHash: statHash,
      value: Math.max(0, statTracker[statHash]),
      isConditionallyActive: false,
    };
    const builtStat = buildStat(hashAndValue, statGroup, defs.Stat.get(statHash), statDisplays);
    builtStat.maximumValue = ARMOR_STAT_DISPLAY_CAP;
    builtStat.base = 0;
    investmentStats.push(builtStat);
  }

  investmentStats.push(totalStat(investmentStats));

  return investmentStats;
}

/**
 * determine if bungie, or our hardcodings, want this stat to be included with the item
 */
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

/**
 * builds and returns a single DimStat, using InvestmentStat information,
 * stat def, statgroup def, and the item's StatDisplayDefinition,
 * which determins which stats are displayed and how they are interpolated
 */
function buildStat(
  itemStat:
    | DestinyItemInvestmentStatDefinition
    | { statTypeHash: number; value: number; isConditionallyActive: boolean },
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
    isConditionallyActive: itemStat.isConditionallyActive,
  };
}

/**
 * mutates an item's stats according to the item's plugged sockets
 * (accounting for mods, masterworks, etc)
 *
 * also adds the projected stat changes to non-selected DimPlugs
 */
function applyPlugsToStats(
  itemDef: DestinyInventoryItemDefinition,
  existingStats: DimStat[], // mutated
  createdItem: DimItem,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  if (!createdItem.sockets?.allSockets.length) {
    return;
  }

  const existingStatsByHash: NodeJS.Dict<DimStat> = _.keyBy(existingStats, (s) => s.statHash);

  // track stats whose investmentValue changes, so we can loop back and re-interpolate them
  const modifiedStats = new Set<number>();

  // loop through sockets looking for plugs that modify an item's investmentStats
  for (const socket of createdItem.sockets.allSockets) {
    // skip this socket/plug if it wouldn't or shouldn't affect stats
    if (!socket.plugged?.enabled || !socket.plugged.plugDef.investmentStats) {
      continue;
    }

    for (const pluggedInvestmentStat of socket.plugged.plugDef.investmentStats) {
      const affectedStatHash = pluggedInvestmentStat.statTypeHash;
      const existingStat = existingStatsByHash[affectedStatHash];
      const investmentChange = pluggedInvestmentStat.value;

      // check special conditionals
      if (
        !isPlugStatActive(
          createdItem,
          socket.plugged.plugDef.hash,
          affectedStatHash,
          pluggedInvestmentStat.isConditionallyActive
        )
      ) {
        continue;
      }

      modifiedStats.add(affectedStatHash);

      if (existingStat) {
        // the stat exists, so we can just adjust it
        existingStat.investmentValue += investmentChange;
      } else {
        // the stat doesn't exist on the item, but needs modifying, so we generate and add it to the item
        if (shouldShowStat(itemDef, affectedStatHash, statDisplays)) {
          if (pluggedInvestmentStat.value) {
            const statDef = defs.Stat.get(affectedStatHash);
            const newStat = buildStat(pluggedInvestmentStat, statGroup, statDef, statDisplays);
            // add the generated stat to our temporary dict, and to the item's stats
            existingStatsByHash[affectedStatHash] = newStat;
            existingStats.push(newStat);
          }
        }
      }
    }
  }

  // Now calculate the actual, interpolated value of all stats after they've been modified
  for (const stat of existingStats) {
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
  const sortedSockets = _.sortBy(createdItem.sockets.allSockets, (s) => s.plugOptions.length);
  for (const socket of sortedSockets) {
    attachPlugStats(socket, existingStatsByHash, statDisplays);
  }
}

/**
 * Generates the stat modification map for each DimPlug in a DimSocket
 * and attaches it to the DimPlug's stats property
 */
function attachPlugStats(
  socket: DimSocket,
  statsByHash: NodeJS.Dict<DimStat>,
  statDisplays: NodeJS.Dict<DestinyStatDisplayDefinition>
) {
  // The plug that is currently inserted into the socket
  const activePlug = socket.plugged;

  // We need to calculate the base investment stat value for the item so we can correctly
  // interpolate each plug's effect on the item.
  const baseItemInvestmentStats: { [statHash: number]: number } = {};

  if (activePlug) {
    const insertedPlugStats: {
      [statHash: number]: number;
    } = {};

    for (const perkStat of activePlug.plugDef.investmentStats) {
      let value = perkStat.value;
      const itemStat = statsByHash[perkStat.statTypeHash];
      const statDisplay = statDisplays[perkStat.statTypeHash];

      if (itemStat) {
        const baseInvestmentStat = itemStat.investmentValue - value;
        baseItemInvestmentStats[perkStat.statTypeHash] = baseInvestmentStat;

        // We could do this in the loop below but we are already looping over the stats so lets just do it here.
        if (statDisplay) {
          // This is a scaled stat, so we need to scale it in context of the original investment stat.
          // Figure out what the interpolated stat value would be without this perk's contribution, and
          // then take the difference between the total value and that to find the contribution.
          const valueWithoutPerk = interpolateStatValue(baseInvestmentStat, statDisplay);
          value = itemStat.value - valueWithoutPerk;
        } else {
          const valueWithoutPerk = Math.min(baseInvestmentStat, itemStat.maximumValue);
          value = itemStat.value - valueWithoutPerk;
        }
      }

      insertedPlugStats[perkStat.statTypeHash] = value;
    }

    activePlug.stats = insertedPlugStats;
  }

  for (const plug of socket.plugOptions) {
    // We already did this plug above and activePlug should be a reference to plug.
    if (plug === activePlug) {
      continue;
    }

    const inactivePlugStats: {
      [statHash: number]: number;
    } = {};

    for (const perkStat of plug.plugDef.investmentStats) {
      let value = perkStat.value;
      const itemStat = statsByHash[perkStat.statTypeHash];
      const statDisplay = statDisplays[perkStat.statTypeHash];

      if (itemStat) {
        // User our calculated baseItemInvestment stat, which is the items investment stat value minus
        // the active plugs investment stat value
        const baseInvestmentStat = baseItemInvestmentStats[perkStat.statTypeHash] ?? itemStat.value;

        if (statDisplay) {
          // This is a scaled stat, so we need to scale it in context of the original investment stat.
          // This time we use the baseItemInvestment value and calculate the interpolated values with
          // and without the perks value, using the difference to get its total contribution to the stat.
          const valueWithoutPerk = interpolateStatValue(baseInvestmentStat, statDisplay);
          const valueWithPerk = interpolateStatValue(baseInvestmentStat + value, statDisplay);

          value = valueWithPerk - valueWithoutPerk;
        } else {
          const baseInvestmentStat =
            baseItemInvestmentStats[perkStat.statTypeHash] ?? itemStat.value;
          const valueWithoutPerk = Math.min(baseInvestmentStat, itemStat.maximumValue);
          const valueWithPerk = Math.min(baseInvestmentStat + value, itemStat.maximumValue);

          value = valueWithPerk - valueWithoutPerk;
        }
      }

      inactivePlugStats[perkStat.statTypeHash] = value;
    }

    plug.stats = inactivePlugStats;
  }
}

/**
 * Build the stats that come "live" from the API's data on real instances
 */
function buildLiveStats(
  stats: DestinyItemStatsComponent,
  itemDef: DestinyInventoryItemDefinition,
  createdItem: DimItem,
  defs: D2ManifestDefinitions,
  statGroup: DestinyStatGroupDefinition,
  statDisplays: { [key: number]: DestinyStatDisplayDefinition }
) {
  const ret: DimStat[] = [];

  // Sum all the conditionally inactive and active plug stats from sockets so we can calculate
  // the value and base. On armour, the live stat includes all mod stats whether they are active or not.
  const inactivePlugStatValues: { [statHash: number]: number } = {};
  const activePlugStatValues: { [statHash: number]: number } = {};
  let negativeModStatFound = false;

  if (createdItem.sockets) {
    for (const { plugged } of createdItem.sockets.allSockets) {
      if (plugged?.enabled && plugged.plugDef.investmentStats) {
        for (const { isConditionallyActive, statTypeHash } of plugged.plugDef.investmentStats) {
          const plugStat = plugged.stats?.[statTypeHash] ?? 0;
          if (
            !isPlugStatActive(
              createdItem,
              plugged.plugDef.hash,
              statTypeHash,
              isConditionallyActive
            )
          ) {
            inactivePlugStatValues[statTypeHash] =
              (inactivePlugStatValues[statTypeHash] ?? 0) + plugStat;
          } else {
            activePlugStatValues[statTypeHash] =
              (activePlugStatValues[statTypeHash] ?? 0) + plugStat;
            negativeModStatFound ||= plugStat < 0;
          }
        }
      }
    }
  }

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

    const value = itemStat.value - (inactivePlugStatValues[statHash] ?? 0);

    ret.push({
      investmentValue: itemStat.value,
      statHash,
      displayProperties: statDef.displayProperties,
      sort: statAllowList.indexOf(statHash),
      value,
      base:
        createdItem.bucket.hash === armorBuckets.classitem
          ? 0
          : value - (activePlugStatValues[statHash] ?? 0),
      // base is never wrong for class items as it's 0
      statMayBeWrong:
        createdItem.bucket.hash !== armorBuckets.classitem &&
        negativeModStatFound &&
        itemStat.value === 0,
      maximumValue,
      bar,
      smallerIsBetter,
      additive: statDef.aggregationType === DestinyStatAggregationType.Character,
      isConditionallyActive: false,
    });
  }

  return ret;
}

function totalStat(stats: DimStat[]): DimStat {
  // TODO: base only
  // TODO: search terms?
  let total = 0;
  let baseTotal = 0;
  let statMayBeWrong = false;

  for (const stat of stats) {
    total += stat.value;
    baseTotal += stat.base;
    statMayBeWrong ||= Boolean(stat.statMayBeWrong);
  }

  return {
    investmentValue: total,
    statHash: TOTAL_STAT_HASH,
    displayProperties: ({
      name: t('Stats.Total'),
    } as any) as DestinyDisplayPropertiesDefinition,
    sort: statAllowList.indexOf(TOTAL_STAT_HASH),
    value: total,
    base: baseTotal,
    statMayBeWrong,
    maximumValue: 100,
    bar: false,
    smallerIsBetter: false,
    additive: false,
    isConditionallyActive: false,
  };
}

function customStat(stats: DimStat[], destinyClass: DestinyClass): DimStat | undefined {
  const customStatDef = settingsSelector(reduxStore.getState()).customTotalStatsByClass[
    destinyClass
  ];

  if (!customStatDef || customStatDef.length === 0 || customStatDef.length === 6) {
    return undefined;
  }

  // Custom stat is always base stat
  let total = 0;
  let statMayBeWrong = false;

  for (const stat of stats) {
    if (customStatDef.includes(stat.statHash)) {
      total += stat.base;
      statMayBeWrong ||= Boolean(stat.statMayBeWrong);
    }
  }

  return {
    investmentValue: total,
    statHash: CUSTOM_TOTAL_STAT_HASH,
    displayProperties: ({
      name: t('Stats.Custom'),
      description: t('Stats.CustomDesc'),
    } as any) as DestinyDisplayPropertiesDefinition,
    sort: statAllowList.indexOf(CUSTOM_TOTAL_STAT_HASH),
    value: total,
    base: total,
    statMayBeWrong,
    maximumValue: 100,
    bar: false,
    smallerIsBetter: false,
    additive: false,
    isConditionallyActive: false,
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
