import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import { DimItem } from 'app/inventory/item-types';
import { ItemFilter } from 'app/search/filter-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { Factor, factorComboCategories, FactorComboCategory, factorCombos } from './triage-factors';

/** returns [dimmed, bright] variations along a 1->100  red->yellow->green line */
export function getValueColors(value: number): [string, string] {
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
        const query = factorCombo.map((f) => f.filter(exampleItem)).join(' ');
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
    if (
      !(
        item.stats && // item must have stats
        // compare only items with the same canonical bucket.
        item.bucket.hash === exampleItem.bucket.hash &&
        // accept anything if seed item is class unknown
        (exampleItem.classType === DestinyClass.Unknown ||
          // or accept individual items if they're matching or unknown.
          item.classType === DestinyClass.Unknown ||
          item.classType === exampleItem.classType) &&
        // accept any tier if seed item is exotic, or filter out exotics if this item isn't
        (exampleItem.isExotic || !item.isExotic)
      )
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
const notabilityThreshold = 0.8;
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
    notableStats: exampleItem.stats
      ?.filter((stat) => stat.base / statMaxes[stat.statHash] >= notabilityThreshold)
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

export function getItemFactorCombos(exampleItem: DimItem) {
  if (!exampleItem.bucket.sort || !factorComboCategories.includes(exampleItem.bucket.sort)) {
    return [];
  }
  return factorCombos[exampleItem.bucket.sort as FactorComboCategory].filter((factorCombo) =>
    factorCombo.every((factor) => factor.runIf(exampleItem))
  );
}
