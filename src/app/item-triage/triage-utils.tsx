import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import { DimItem } from 'app/inventory/item-types';
import {
  CUSTOM_TOTAL_STAT_HASH,
  D2ArmorStatHashByName,
  TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { quoteFilterString } from 'app/search/query-parser';
import { itemTypeFilter } from 'app/search/search-filters/known-values';
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

export function getBetterWorseItems(
  exampleItem: DimItem,
  allItems: DimItem[],
  filterFactory: (query: string) => ItemFilter
) {
  const itemTypeFilterString = itemTypeFilter.fromItem!(exampleItem);

  const exoticFilter = exampleItem.isExotic ? 'is:exotic' : 'not:exotic';

  const exampleItemModSlotMetadatas = getInterestingSocketMetadatas(exampleItem) ?? [];
  const modSlotFilter = `${exampleItemModSlotMetadatas
    .map((m) => `modslot:${m.slotTag || 'none'}`)
    .join(' ')}`;

  const exampleItemIntrinsic =
    !exampleItem.isExotic &&
    getIntrinsicArmorPerkSocket(exampleItem)?.plugged?.plugDef.displayProperties;
  const intrinsicFilter = exampleItemIntrinsic
    ? `perk:${quoteFilterString(exampleItemIntrinsic.name)}`
    : '';
  const exampleItemStats = getStatValuesByHash(exampleItem, 'base');

  const betterStatsFilter =
    armorStatFilterNames
      .map((n) => `basestat:${n}:>=${exampleItemStats[D2ArmorStatHashByName[n]]}`)
      .join(' ') + ` basestat:total:>${exampleItemStats[TOTAL_STAT_HASH]}`;
  const betterFilter = `(${itemTypeFilterString} ${exoticFilter} ${modSlotFilter} ${intrinsicFilter} ${betterStatsFilter})`;
  const betterItems = allItems.filter(filterFactory(betterFilter));

  const worseStatsFilter =
    armorStatFilterNames
      .map((n) => `basestat:${n}:<=${exampleItemStats[D2ArmorStatHashByName[n]]}`)
      .join(' ') + ` basestat:total:>${exampleItemStats[TOTAL_STAT_HASH]}`;
  const worseFilter = `(${itemTypeFilterString} ${exoticFilter} ((${modSlotFilter}) or modslot:none) ${intrinsicFilter} ${worseStatsFilter})`;
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
    item.stats.forEach((stat) => {
      const bestStatSoFar: number =
        statMaxes[stat.statHash] ?? (stat.smallerIsBetter ? 9999999 : -9999999);
      const newBestStat = (stat.smallerIsBetter ? Math.min : Math.max)(bestStatSoFar, stat.base);
      statMaxes[stat.statHash] = newBestStat;

      if (customStatTotalHashes.includes(stat.statHash)) {
        thisItemCustomStatTotal += stat.base;
      }
    });
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
