import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { D1ItemCategoryHashes } from 'app/search/d1-known-values';
import { armorStats, evenStatWeights, TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { isPlugStatActive } from 'app/utils/item-utils';
import { weakMemoize } from 'app/utils/util';
import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyStatAggregationType,
  DestinyStatCategory,
  DestinyStatDefinition,
  DestinyStatDisplayDefinition,
  DestinyStatGroupDefinition,
} from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { Draft } from 'immer';
import _ from 'lodash';
import { socketContainsIntrinsicPlug } from '../../utils/socket-utils';
import { DimItem, DimPlug, DimSocket, DimStat } from '../item-types';
import { makeCustomStat } from './stats-custom';

/**
 * These are the utilities that deal with Stats on items - specifically, how to calculate them.
 *
 * This is called from within d2-item-factory.service.ts
 *
 * the process looks like this:
 *
 * buildStats(stats) {
 *   stats = buildInvestmentStats(stats) // based on information from an item's inherent stats
 *   applyPlugsToStats(stats)            // mutates stats. adds values provided by sockets (intrinsic armor stats&gun parts)
 *   if (is armor) {
 *     if (any armor stat is missing) fill in missing stats with 0s
 *     synthesize totalStat and add it
 *     if (not classitem) synthesize customStat and add it
 *   }
 * }
 */

/**
 * Which stats to display, and in which order.
 */
const itemStatAllowList = [
  StatHashes.RoundsPerMinute,
  StatHashes.ChargeTime,
  StatHashes.DrawTime,
  StatHashes.BlastRadius,
  StatHashes.Velocity,
  StatHashes.SwingSpeed,
  StatHashes.Impact,
  StatHashes.Range,
  StatHashes.ShieldDuration,
  StatHashes.GuardEfficiency,
  StatHashes.GuardResistance,
  StatHashes.Accuracy,
  StatHashes.Stability,
  StatHashes.Handling,
  StatHashes.ChargeRate,
  StatHashes.GuardEndurance,
  StatHashes.ReloadSpeed,
  StatHashes.AimAssistance,
  StatHashes.AirborneEffectiveness,
  StatHashes.Zoom,
  StatHashes.RecoilDirection,
  StatHashes.Magazine,
  StatHashes.AmmoCapacity,
  ...armorStats,
  TOTAL_STAT_HASH,
];
export function getStatSortOrder(statHash: number) {
  const order = itemStatAllowList.indexOf(statHash);
  return order === -1 ? 999999 + Math.abs(statHash) : order;
}

export function isAllowedItemStat(statHash: number) {
  return itemStatAllowList.includes(statHash) || statHash < 0;
}

/**
 * Stats that are allowed for plugs, in addition to stats their items own.
 */
const plugStatAllowList = [StatHashes.AspectEnergyCapacity];

export function isAllowedPlugStat(statHash: number) {
  return plugStatAllowList.includes(statHash);
}

/** Stats that are measured in milliseconds. */
export const statsMs = [StatHashes.DrawTime, StatHashes.ChargeTime];

/** Stats that should be forced to display without a bar (just a number). */
const statsNoBar = [
  StatHashes.RoundsPerMinute,
  StatHashes.Magazine,
  StatHashes.RecoilDirection,
  ...statsMs,
];

/** Show these stats in addition to any "natural" stats */
const hiddenStatsAllowList = [
  StatHashes.AimAssistance,
  StatHashes.Zoom,
  StatHashes.RecoilDirection,
  StatHashes.AirborneEffectiveness,
];

/** a dictionary to look up StatDisplay info by statHash */
interface StatDisplayLookup {
  [statHash: number]: DestinyStatDisplayDefinition | undefined;
}

/** a dictionary to look up an item's DimStats by statHash */
export interface StatLookup {
  [statHash: number]: DimStat | undefined;
}

// apparently worth it, when needing this 100s of times per inv build
const memoTotalName = _.once(() => t('Stats.Total'));
const memoCustomDesc = _.once(() => t('Stats.CustomDesc'));

const memoStatDisplaysByStatHash = weakMemoize((statGroup: DestinyStatGroupDefinition) =>
  keyByStatHash(statGroup.scaledStats)
);

/** Build the full list of stats for an item. If the item has no stats, this returns null. */
export function buildStats(
  defs: D2ManifestDefinitions,
  createdItem: DimItem,
  customStats: CustomStatDef[],
  itemDef = defs.InventoryItem.get(createdItem.hash)
) {
  if (!itemDef.stats?.statGroupHash) {
    return null;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return null;
  }

  // we re-use this dictionary a bunch of times in subsequent
  // functions to speed up display info lookups
  const statDisplaysByStatHash = memoStatDisplaysByStatHash(statGroup);

  // We only use the raw "investment" stats to calculate all item stats.
  const investmentStats =
    buildInvestmentStats(itemDef, defs, statGroup, statDisplaysByStatHash) || [];

  // Include the contributions from perks and mods
  applyPlugsToStats(itemDef, investmentStats, createdItem, defs, statGroup, statDisplaysByStatHash);

  if (createdItem.bucket.hash === BucketHashes.Subclass || createdItem.bucket.inArmor) {
    // one last check for missing stats on armor or subclasses
    const existingStatHashes = investmentStats.map((s) => s.statHash);
    for (const armorStat of armorStats) {
      if (!existingStatHashes.includes(armorStat)) {
        investmentStats.push(
          buildStat(
            armorStat,
            0,
            false,
            statGroup,
            defs.Stat.get(armorStat),
            statDisplaysByStatHash
          )
        );
      }
    }
  }

  if (createdItem.bucket.inArmor) {
    // synthesize the "Total" stat for armor
    // it's effectively just a custom total with 6 stats evenly weighted
    const tStat = makeCustomStat(
      investmentStats,
      evenStatWeights,
      TOTAL_STAT_HASH,
      memoTotalName(),
      '',
      false
    );
    investmentStats.push(tStat!);

    // synthesize custom stats for meaningfully stat-bearing items
    if (createdItem.type !== 'ClassItem') {
      for (const customStat of customStats) {
        if (
          customStat.class === createdItem.classType ||
          customStat.class === DestinyClass.Unknown
        ) {
          const cStat = makeCustomStat(
            investmentStats,
            customStat.weights,
            customStat.statHash,
            customStat.label,
            memoCustomDesc(),
            true
          );
          if (cStat) {
            investmentStats.push(cStat);
          }
        }
      }
    }
  }

  return investmentStats.length ? investmentStats.sort(compareBy((s) => s.sort)) : null;
}

/**
 * determine if bungie, or our hardcodings, want this stat to be included with the item
 */
function shouldShowStat(
  itemDef: DestinyInventoryItemDefinition,
  statHash: number,
  statDisplaysByStatHash: StatDisplayLookup
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

  return Boolean(
    // Must be on the list of interpolated stats, or included in the hardcoded hidden stats list
    (statDisplaysByStatHash[statHash] ||
      (includeHiddenStats && hiddenStatsAllowList.includes(statHash))) &&
      // Must be a stat we want to display
      isAllowedItemStat(statHash)
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
  statDisplaysByStatHash: StatDisplayLookup
): DimStat[] {
  const itemStats = itemDef.investmentStats || [];

  const ret: DimStat[] = [];
  for (const itemStat of itemStats) {
    const statHash = itemStat.statTypeHash;
    if (!itemStat || !shouldShowStat(itemDef, statHash, statDisplaysByStatHash)) {
      continue;
    }

    const def = defs.Stat.get(statHash);
    if (!def) {
      continue;
    }

    ret.push(
      buildStat(
        itemStat.statTypeHash,
        itemStat.value,
        itemStat.isConditionallyActive,
        statGroup,
        def,
        statDisplaysByStatHash
      )
    );
  }

  return ret;
}

/**
 * builds and returns a single DimStat, using InvestmentStat information,
 * stat def, statgroup def, and the item's StatDisplayDefinition,
 * which determines which stats are displayed and how they are interpolated
 */
function buildStat(
  statHash: number,
  value: number,
  isConditionallyActive: boolean,
  statGroup: DestinyStatGroupDefinition,
  statDef: DestinyStatDefinition,
  statDisplaysByStatHash: StatDisplayLookup
): DimStat {
  value = value || 0;
  const investmentValue = value;
  let maximumValue = statGroup.maximumValue;
  let bar = !statsNoBar.includes(statHash);
  let smallerIsBetter = false;
  const statDisplay = statDisplaysByStatHash[statHash];
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
    investmentValue,
    statHash,
    displayProperties: statDef.displayProperties,
    sort: getStatSortOrder(statHash),
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
    isConditionallyActive: isConditionallyActive,
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
  statDisplaysByStatHash: StatDisplayLookup
) {
  if (!createdItem.sockets?.allSockets.length) {
    return;
  }

  const existingStatsByHash = keyByStatHash(existingStats);

  // intrinsic plugs aren't "enhancements", they define the basic stats of armor
  // we do those first and include them in the stat's base value
  const [intrinsicSockets, otherSockets] = _.partition(
    createdItem.sockets.allSockets,
    socketContainsIntrinsicPlug
  );

  const socketLists = [
    [true, intrinsicSockets],
    [false, otherSockets],
  ] as const;

  // loop through sockets looking for plugs that modify an item's investmentStats
  for (const [affectsBase, socketList] of socketLists) {
    for (const socket of socketList) {
      // skip this socket+plug if it's disabled or doesn't affect stats
      if (!socket.plugged?.enabled || !socket.plugged.plugDef.investmentStats) {
        continue;
      }

      for (const pluggedInvestmentStat of socket.plugged.plugDef.investmentStats) {
        const affectedStatHash = pluggedInvestmentStat.statTypeHash;

        let existingStat = existingStatsByHash[affectedStatHash];
        // in case this stat should appear but hasn't been built yet, create and attach it first
        if (!existingStat) {
          // If the stat is already in our list it's already passed this check. But most armor hits this.
          if (!shouldShowStat(itemDef, affectedStatHash, statDisplaysByStatHash)) {
            continue;
          }
          const statDef = defs.Stat.get(affectedStatHash);
          const newStat = buildStat(
            affectedStatHash,
            0,
            pluggedInvestmentStat.isConditionallyActive,
            statGroup,
            statDef,
            statDisplaysByStatHash
          );
          // add the newly generated stat to our temporary dict, and to the item's stats
          existingStatsByHash[affectedStatHash] = newStat;
          existingStats.push(newStat);
          existingStat = newStat;
        }

        // check special conditionals
        if (
          !isPlugStatActive(
            createdItem,
            socket.plugged.plugDef,
            affectedStatHash,
            pluggedInvestmentStat.isConditionallyActive
          )
        ) {
          continue;
        }

        // we've ruled out reasons to ignore this investment stat. apply its effects to the investmentValue
        existingStat.investmentValue += pluggedInvestmentStat.value;

        // finally, re-interpolate the stat value
        const statDisplay = statDisplaysByStatHash[affectedStatHash];
        const newStatValue = statDisplay
          ? interpolateStatValue(existingStat.investmentValue, statDisplay)
          : Math.min(existingStat.investmentValue, existingStat.maximumValue);
        if (affectsBase) {
          existingStat.base = newStatValue;
        }
        existingStat.value = newStatValue;
      }
    }
  }

  // We sort the sockets by length so that we count contributions from plugs with fewer options first.
  // This is because multiple plugs can contribute to the same stat, so we want to sink the non-changeable
  // stats in first.
  const sortedSockets = [...createdItem.sockets.allSockets].sort(
    compareBy((s) => s.plugOptions.length)
  );
  for (const socket of sortedSockets) {
    attachPlugStats(socket, existingStatsByHash, statDisplaysByStatHash);
  }
}

/**
 * Generates the stat modification map for each DimPlug in a DimSocket
 * and attaches it to the DimPlug's stats property
 */
function attachPlugStats(
  socket: DimSocket,
  statsByHash: StatLookup,
  statDisplaysByStatHash: StatDisplayLookup
) {
  // The plug that is currently inserted into the socket
  const activePlug = socket.plugged;

  // This holds the item's 'base' investment stat values without any plug additions.
  const baseItemInvestmentStats: DimPlug['stats'] = {};

  // The active plug is already contributing to the item's stats in statsByHash. Thus we treat it separately
  // here for two reasons,
  // 1. We need to calculate the 'base' investment stat value (without this plug's contribution) for the
  // item's stats so that we can calculate correct values for the inactive plugs.
  // 2. By utilizing the fact that the item's stats already include this, we can do one less interpolation
  // per stat to figure out the active plug's stat contribution.
  if (activePlug) {
    const activePlugStats: DimPlug['stats'] = {};

    for (const plugInvestmentStat of activePlug.plugDef.investmentStats) {
      let plugStatValue = plugInvestmentStat.value;
      const itemStat = statsByHash[plugInvestmentStat.statTypeHash];
      const statDisplay = statDisplaysByStatHash[plugInvestmentStat.statTypeHash];

      if (itemStat) {
        const baseInvestmentStat = itemStat.investmentValue - plugStatValue;
        baseItemInvestmentStats[plugInvestmentStat.statTypeHash] = baseInvestmentStat;

        // Figure out what the interpolated stat value would be without the active perk's contribution
        // and then take the difference between that and the original stat value to find the perk's contribution.
        if (statDisplay) {
          // This is an interpolated stat type, so we need to compare interpolated values with and without this perk
          const valueWithoutPerk = interpolateStatValue(baseInvestmentStat, statDisplay);
          plugStatValue = itemStat.value - valueWithoutPerk;
        } else {
          const valueWithoutPerk = Math.min(baseInvestmentStat, itemStat.maximumValue);
          plugStatValue = itemStat.value - valueWithoutPerk;
        }
      }

      activePlugStats[plugInvestmentStat.statTypeHash] = plugStatValue;
    }

    // We can mutate the stats here, as the plug has just been freshly constructed. If that ever changes we will need
    // to reconsider.
    (activePlug as Draft<DimPlug>).stats = activePlugStats;
  }

  for (const plug of socket.plugOptions) {
    // We already did this plug above and activePlug should be a reference to plug.
    if (plug.plugDef.hash === socket.plugged?.plugDef.hash) {
      continue;
    }

    const plugStats: DimPlug['stats'] = {};

    for (const plugInvestmentStat of plug.plugDef.investmentStats) {
      let plugStatValue = plugInvestmentStat.value;
      const itemStat = statsByHash[plugInvestmentStat.statTypeHash];
      const statDisplay = statDisplaysByStatHash[plugInvestmentStat.statTypeHash];

      if (itemStat) {
        // User our calculated baseItemInvestment stat, which is the items investment stat value minus
        // the active plugs investment stat value
        const baseInvestmentStat =
          baseItemInvestmentStats[plugInvestmentStat.statTypeHash] ?? itemStat.value;

        // This time we use the baseItemInvestment value we computed earlier to calculate the interpolated stat value with
        // and without the perk's value, using the difference to get its individual contribution to the stat.
        // These calculations are equivalent to the ones used for the active plug's stats.
        if (statDisplay) {
          // This is an interpolated stat type, so we need to compare interpolated values with and without this perk
          const valueWithoutPerk = interpolateStatValue(baseInvestmentStat, statDisplay);
          const valueWithPerk = interpolateStatValue(
            baseInvestmentStat + plugStatValue,
            statDisplay
          );

          plugStatValue = valueWithPerk - valueWithoutPerk;
        } else {
          const baseInvestmentStat =
            baseItemInvestmentStats[plugInvestmentStat.statTypeHash] ?? itemStat.value;
          const valueWithoutPerk = Math.min(baseInvestmentStat, itemStat.maximumValue);
          const valueWithPerk = Math.min(baseInvestmentStat + plugStatValue, itemStat.maximumValue);

          plugStatValue = valueWithPerk - valueWithoutPerk;
        }
      }

      plugStats[plugInvestmentStat.statTypeHash] = plugStatValue;
    }

    // Yes, we are mutating the stats in place! This relies on the plugs being built fresh every time.
    (plug as Draft<DimPlug>).stats = plugStats;
  }
}

/**
 * Some stats have an item-specific interpolation table, which is defined as
 * a piecewise linear function mapping input stat values to output stat values.
 */
export function interpolateStatValue(value: number, statDisplay: DestinyStatDisplayDefinition) {
  // right now, we are not doing stat interpolation for armor.
  // they're 1:1 in effects, and we are ignoring the clamping
  if (armorStats.includes(statDisplay.statHash)) {
    return value;
  }
  const interp = statDisplay.displayInterpolation;
  // Clamp the value to prevent overfilling
  value = Math.min(value, statDisplay.maximumValue);

  let endIndex = interp.findIndex((p) => p.value > value);

  // value < 0 is for mods with negative stats
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

export function keyByStatHash(stats: DimStat[]): StatLookup;
export function keyByStatHash(stats: DestinyStatDisplayDefinition[]): StatDisplayLookup;
export function keyByStatHash(stats: (DimStat | DestinyStatDisplayDefinition)[]): {
  [statHash: number]: DimStat | DestinyStatDisplayDefinition | undefined;
} {
  const keyed: { [statHash: number]: any } = {};
  for (const stat of stats) {
    keyed[stat.statHash] = stat;
  }
  return keyed;
}
