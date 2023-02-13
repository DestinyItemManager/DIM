import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import { DimItem } from 'app/inventory/item-types';
import {
  CUSTOM_TOTAL_STAT_HASH,
  D2ArmorStatHashByName,
  TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { quoteFilterString } from 'app/search/query-parser';
import { classFilter, itemTypeFilter } from 'app/search/search-filters/known-values';
import { getInterestingSocketMetadatas, getStatValuesByHash } from 'app/utils/item-utils';
import { getIntrinsicArmorPerkSocket } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { Factor, factorComboCategories, FactorComboCategory, factorCombos } from './triage-factors';

/** returns [dimmed, bright] variations along a 1->100  red->yellow->green line */
export function getValueColors(value: number): [string, string] {
  value = Math.min(value, 100);
  const hue = value * 1.25;
  const light = Math.floor(-(value ** 2 / 250) + (2 * value) / 5 + 30);
  return [`hsl(${hue}, 100%, 8%)`, `hsl(${hue}, 100%, ${light}%)`];
}

export function getSimilarItems(
  exampleItem: DimItem,
  allItems: DimItem[],
  filterFactory: (query: string) => ItemFilter
) {
  const results: {
    count: number;
    items: DimItem[];
    query: string;
    factorCombo: Factor[];
  }[] = [];

  if (factorComboCategories.includes(exampleItem.bucket.sort!)) {
    for (const factorCombo of factorCombos[exampleItem.bucket.sort as FactorComboCategory]) {
      if (factorCombo.every((factor) => factor.runIf(exampleItem))) {
        const filters = factorCombo.map((f) => f.filter(exampleItem));
        filters.push(exampleItem.isExotic ? 'is:exotic' : 'not:exotic');
        const query = filters.join(' ');
        const items = allItems.filter(filterFactory(query));
        const count = items.length;

        // don't include the name row if this is the only copy of this item
        if (count === 1 && factorCombo.some((f) => f.id === 'name')) {
          continue;
        }

        results.push({
          count,
          items,
          query,
          factorCombo,
        });
      }
    }
  }

  return results;
}

const armorStatFilterNames = Object.keys(D2ArmorStatHashByName);

/**
 * this collects strictly better, and strictly worse items.
 * a strictly worse item is statlower,
 * and also has no special modslot or other factor,
 * compared to the item(s) it's statlower than.
 *
 * a strictly better piece is one that another piece is strictly worse than.
 */
export function getBetterWorseItems(
  exampleItem: DimItem,
  allItems: DimItem[],
  filterFactory: (query: string) => ItemFilter
) {
  const itemTypeFilterString = itemTypeFilter.fromItem!(exampleItem);
  const guardianClassFilterString = classFilter.fromItem!(exampleItem);

  // only compare exotics to exotics, and non- to non-
  const exoticnessFilter = exampleItem.isExotic ? 'is:exotic' : 'not:exotic';

  // always only compare to similar item types, exoticness, and class
  const alwaysFilters = `${itemTypeFilterString} ${exoticnessFilter} ${guardianClassFilterString}`;

  const exampleItemModSlotMetadatas = getInterestingSocketMetadatas(exampleItem);
  // if defined, this perfectly matches the modslots of the example item
  const modSlotFilter =
    exampleItemModSlotMetadatas &&
    `(${exampleItemModSlotMetadatas.map((m) => `modslot:${m.slotTag || 'none'}`).join(' ')})`;

  const exampleItemIntrinsic =
    !exampleItem.isExotic &&
    getIntrinsicArmorPerkSocket(exampleItem)?.plugged?.plugDef.displayProperties;

  const exampleItemStats = getStatValuesByHash(exampleItem, 'base');

  // better or equal individual stats, and better total
  const betterStatsFilter =
    armorStatFilterNames
      .map((n) => `basestat:${n}:>=${exampleItemStats[D2ArmorStatHashByName[n]]}`)
      .join(' ') + ` basestat:total:>${exampleItemStats[TOTAL_STAT_HASH]}`;

  // the better item must have the same intrinsic (or example must have none) to be better than example
  const betterIntrinsicFilter = exampleItemIntrinsic
    ? `perk:${quoteFilterString(exampleItemIntrinsic.name)}`
    : '';

  const betterFilter = `(${alwaysFilters} ${
    modSlotFilter ?? ''
  } ${betterIntrinsicFilter} ${betterStatsFilter})`;
  const betterItems = allItems.filter(filterFactory(betterFilter));

  // worse or equal individual stats, and worse total
  const worseStatsFilter =
    armorStatFilterNames
      .map((n) => `basestat:${n}:<=${exampleItemStats[D2ArmorStatHashByName[n]]}`)
      .join(' ') + ` basestat:total:<${exampleItemStats[TOTAL_STAT_HASH]}`;

  // a worse item must have the same intrinsic or none to be worse than this example
  const worseIntrinsicFilter = exampleItemIntrinsic
    ? `(perk:${quoteFilterString(exampleItemIntrinsic.name)} or armorintrinsic:none)`
    : '';

  // a worse item's modslot can either be equal to the better item's, or missing
  const worseModSlotFilter = modSlotFilter ? `(${modSlotFilter} or modslot:none)` : '';
  const worseFilter = `(${alwaysFilters} ${worseModSlotFilter} ${worseIntrinsicFilter} ${worseStatsFilter})`;
  const worseItems = allItems.filter(filterFactory(worseFilter));

  return { betterItems, worseItems, betterFilter, worseFilter };
}

/**
 * given a seed item (one that all items will be compared to),
 * derives all items from stores, then gathers stat maxes for items worth comparing
 */
function collectRelevantStatMaxes(
  exampleItem: DimItem,
  customStatTotalHashes: number[],
  allItems: DimItem[]
) {
  // highest values found in relevant items, keyed by stat hash
  const statMaxes: Record<number | string, number> = { custom: 0 };

  for (const item of allItems) {
    // reasons to skip gathering stats from this item
    if (
      // skip items without stats
      !item.stats ||
      // compare only items with the same canonical bucket.
      item.bucket.hash !== exampleItem.bucket.hash ||
      // item needs to be class-comparable
      (exampleItem.classType !== DestinyClass.Unknown &&
        item.classType !== DestinyClass.Unknown &&
        item.classType !== exampleItem.classType) ||
      // compare exotics' stats only to dupes
      (exampleItem.isExotic && exampleItem.hash !== item.hash)
    ) {
      continue;
    }

    let thisItemCustomStatTotal = 0;
    for (const stat of item.stats) {
      const bestStatSoFar = statMaxes[stat.statHash] ?? (stat.smallerIsBetter ? 9999999 : -9999999);
      const newBestStat = (stat.smallerIsBetter ? Math.min : Math.max)(bestStatSoFar, stat.base);
      statMaxes[stat.statHash] = newBestStat;

      if (customStatTotalHashes.includes(stat.statHash)) {
        thisItemCustomStatTotal += stat.base;
      }
    }
    statMaxes['custom'] = Math.max(statMaxes['custom'], thisItemCustomStatTotal);
  }

  return statMaxes;
}

// a stat is notable on seed item when it's at least this % of the best owned
const notabilityThreshold = 0.82;
// total works within a smaller range with a big lower bound so let's be pickier
const totalNotabilityThreshold = 0.9;
/**
 * returns an entry for each notable stat found on the seed item
 */
export function getNotableStats(
  exampleItem: DimItem,
  customTotalStatsByClass: StatHashListsKeyedByDestinyClass,
  allItems: DimItem[]
) {
  const customStatTotalHashes = customTotalStatsByClass[exampleItem.classType] ?? [];
  const statMaxes = collectRelevantStatMaxes(exampleItem, customStatTotalHashes, allItems);

  const customTotal =
    exampleItem.stats?.reduce(
      (total, stat) => (customStatTotalHashes.includes(stat.statHash) ? total + stat.base : total),
      0
    ) ?? 0;
  const customRatio = customTotal / statMaxes.custom || 0;
  return {
    notableStats: (exampleItem.stats ?? [])
      .filter((stat) => {
        const statPercent = stat.base / statMaxes[stat.statHash];
        return (
          statPercent >=
          (stat.statHash === TOTAL_STAT_HASH || stat.statHash === CUSTOM_TOTAL_STAT_HASH
            ? totalNotabilityThreshold
            : notabilityThreshold)
        );
      })
      .map((stat) => {
        const best = statMaxes[stat.statHash];
        const rawRatio = stat.base / best || 0;

        return {
          /** quality is a number from 0 to 100 representing keepworthiness */
          quality: 100 - (10 - Math.floor(rawRatio * 10)) * (100 / 3),
          /** seed item's copy of this stat */
          stat,
          /** best of this stat */
          best,
          /** whole # percentage of seed item's stat compared to the best of that stat */
          percent: Math.floor(rawRatio * 100),
        };
      }),
    customTotalMax: {
      quality: 100 - (10 - Math.floor(customRatio * 10)) * (100 / 3),
      stat: customTotal,
      best: statMaxes.custom,
      percent: Math.floor(customRatio * 100),
    },
  };
}
