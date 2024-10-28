import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import { DimItem } from 'app/inventory/item-types';
import { keyByStatHash, StatLookup } from 'app/inventory/store/stats';
import { armorStats, CUSTOM_TOTAL_STAT_HASH, TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { classFilter, itemTypeFilter } from 'app/search/items/search-filters/known-values';
import { quoteFilterString } from 'app/search/query-parser';
import { getInterestingSocketMetadatas, isArtifice, isClassCompatible } from 'app/utils/item-utils';
import { getIntrinsicArmorPerkSocket } from 'app/utils/socket-utils';
import { partition } from 'es-toolkit';
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
  filterFactory: (query: string) => ItemFilter,
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
  filterFactory: (query: string) => ItemFilter,
) {
  // example DimItem MUST HAVE STATS but making the return type |undefined
  // just to do that check is annoying, so it's pre-checked in BetterItemsTriageSection

  const itemTypeFilterString = itemTypeFilter.fromItem(exampleItem);
  const guardianClassFilterString = classFilter.fromItem(exampleItem);

  // only compare exotics to exotics, and non- to non-                  don't compare old weird stuff
  const rarityFilter = exampleItem.isExotic ? 'is:exotic' : '(not:exotic not:green not:white)';

  // always only compare to similar item types, rarity, and class
  const alwaysFilters = `${itemTypeFilterString} ${rarityFilter} ${guardianClassFilterString}`;

  // do some base filtering first
  const comparableItems = allItems.filter(filterFactory(alwaysFilters));

  // items that were judged to be stat better or statworse than exampleItem
  const rawBetterStatItems: DimItem[] = [];
  const rawWorseStatItems: DimItem[] = [];

  // items that were judged to be stat better or statworse than exampleItem,
  // based on artifice rules
  const rawArtificeBetterStatItems: DimItem[] = [];
  const rawArtificeWorseStatItems: DimItem[] = [];

  const exampleItemStats = keyByStatHash(exampleItem.stats!);
  const exampleIsArtifice = isArtifice(exampleItem);
  for (const thisItem of comparableItems) {
    if (thisItem.stats) {
      const itemIsArtifice = isArtifice(thisItem);
      const thisItemStats = keyByStatHash(thisItem.stats);
      let result: false | StatLookup = false;
      let resultDueToArtifice = false;
      if (exampleIsArtifice === itemIsArtifice) {
        result = compareBetterStats(exampleItemStats, thisItemStats, false);
      } else {
        // there's unequal artificeness
        const artPieceStats = exampleIsArtifice ? exampleItemStats : thisItemStats;
        const normPieceStats = exampleIsArtifice ? thisItemStats : exampleItemStats;
        // see if artifice is better without any adjustment
        if (compareBetterStats(artPieceStats, normPieceStats, false) === artPieceStats) {
          result = artPieceStats;
        } else {
          result = compareBetterStats(artPieceStats, normPieceStats, true);
          resultDueToArtifice = true;
        }
      }
      // did one of them turn out better than the other?
      if (result) {
        // if exampleItem won, then thisItem goes into a worse array.
        // otherwise thisItem won, so it goes into a better array
        const insertInto =
          result === exampleItemStats
            ? resultDueToArtifice
              ? rawArtificeWorseStatItems
              : rawWorseStatItems
            : resultDueToArtifice
              ? rawArtificeBetterStatItems
              : rawBetterStatItems;

        insertInto.push(thisItem);
      }
    }
  }

  const exampleItemModSlotMetadatas = getInterestingSocketMetadatas(exampleItem);

  // if defined, this is a filter string that perfectly matches the modslots of the example item
  const modSlotFilter =
    exampleItemModSlotMetadatas &&
    `(${exampleItemModSlotMetadatas.map((m) => `modslot:${m.slotTag || 'none'}`).join(' ')})`;

  // the intrinsic that the example item has, if it has one
  const exampleItemIntrinsic =
    !exampleItem.isExotic &&
    getIntrinsicArmorPerkSocket(exampleItem)?.plugged?.plugDef.displayProperties;

  const betterFilterParts: string[] = [];
  // if example item has an intrinsic, the better item must have the same intrinsic to be better
  if (exampleItemIntrinsic) {
    betterFilterParts.push(`perk:${quoteFilterString(exampleItemIntrinsic.name)}`);
  }
  // if this has a special modslot, the better item must also have that same modslot
  if (modSlotFilter) {
    betterFilterParts.push(modSlotFilter);
  }

  const betterFilter = filterFactory(betterFilterParts.join(' '));
  const [betterItems, betterStatItems] = partition(rawBetterStatItems, (i) =>
    Boolean(betterFilter(i)),
  );
  const [artificeBetterItems, artificeBetterStatItems] = partition(
    rawArtificeBetterStatItems,
    (i) => Boolean(betterFilter(i)),
  );

  const worseFilterParts: string[] = [];
  // a worse item must have the same intrinsic or none, to be worse than the example
  if (exampleItemIntrinsic) {
    worseFilterParts.push(
      `(perk:${quoteFilterString(exampleItemIntrinsic.name)} or armorintrinsic:none)`,
    );
  }
  // a worse item's modslot can either be equal to the better item's, or missing
  if (modSlotFilter) {
    worseFilterParts.push(`(${modSlotFilter} or modslot:none)`);
  }

  const worseFilter = filterFactory(worseFilterParts.join(' '));
  const [worseItems, worseStatItems] = partition(rawWorseStatItems, (i) => Boolean(worseFilter(i)));
  const [artificeWorseItems, artificeWorseStatItems] = partition(rawArtificeWorseStatItems, (i) =>
    Boolean(worseFilter(i)),
  );

  return {
    betterItems,
    betterStatItems,
    artificeBetterItems,
    artificeBetterStatItems,
    worseItems,
    worseStatItems,
    artificeWorseItems,
    artificeWorseStatItems,
  };
}

/**
 * given a seed item (one that all items will be compared to),
 * derives all items from stores, then gathers stat maxes for items worth comparing
 */
function collectRelevantStatMaxes(
  exampleItem: DimItem,
  customStatTotalHashes: number[],
  allItems: DimItem[],
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
      !isClassCompatible(exampleItem.classType, item.classType) ||
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
    statMaxes.custom = Math.max(statMaxes.custom, thisItemCustomStatTotal);
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
  allItems: DimItem[],
) {
  const customStatTotalHashes = customTotalStatsByClass[exampleItem.classType] ?? [];
  const statMaxes = collectRelevantStatMaxes(exampleItem, customStatTotalHashes, allItems);

  const customTotal =
    exampleItem.stats?.reduce(
      (total, stat) => (customStatTotalHashes.includes(stat.statHash) ? total + stat.base : total),
      0,
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

/**
 * checks if statsA or statsB is just plain better than the other,
 * measuring only by the given stats
 *
 * if `aIsArtifice`, then allow assuming one stat of `A` is bumped up by 3,
 * to try and surpass the non-artifice piece.
 * this gives artifice an extra chance to "win".
 *
 * this might claim a specific normal piece is statbetter than a specific artifice piece.
 * but that doesn't mean we should recommend deleting the artifice piece,
 * because configurable stats are sort of their own advantage. at worst it's a trade-off.
 *
 * returns the winning stat dict, or false for neither was completely better
 */
export function compareBetterStats(
  statsA: StatLookup,
  statsB: StatLookup,
  aIsArtifice: boolean,
  whichStatHashes = armorStats, // default to all 6 armor stats
): StatLookup | false {
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  let aArtificeToken = aIsArtifice;

  // The differences in considered stats A - B, sorted descending so that the artifice token
  // is spent on a stat where A *can* be better than B
  const statDifferences = whichStatHashes.map(
    (statHash) => (statsA[statHash]?.base ?? 0) - (statsB[statHash]?.base ?? 0),
  );
  statDifferences.sort((a, b) => b - a);
  for (let diff of statDifferences) {
    // if B beats A in a stat, A expends its artifice token to try and make up for it
    if (diff < 0 && aArtificeToken) {
      diff += 3;
      aArtificeToken = false;
    }

    if (diff > 0) {
      aWins++;
    } else if (diff < 0) {
      bWins++;
    } else {
      ties++;
    }

    // if at any point, both have some wins, we're done here. neither is completely lower than the other.
    if (aWins && bWins) {
      return false;
    }
  }

  // if they're all ties, we have a tie.
  // this also catches the case of an empty stat hashes array.
  if (ties === whichStatHashes.length) {
    // If A still has its artifice token available, it's definitely better.
    // But if A caused a tie with its artifice slot, it's still better because it's more flexible.
    // So in case of ties A wins if it's an artifice piece even if it used its token.
    return aIsArtifice ? statsA : false;
  }
  // we dealt with ties and if both pieces had advantages,
  // so we should have a winner at this point.

  return aWins ? statsA : bWins ? statsB : false;
  // this false fallback shouldn't crop up, but just in case, we make no judgement
}
