import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { tl } from 'app/i18next-t';
import { DimItem, DimStat } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { maxLightItemSet, maxStatLoadout } from 'app/loadout-drawer/auto-loadouts';
import {
  allAtomicStats,
  armorAnyStatHashes,
  armorStatHashes,
  dimArmorStatHashByName,
  est,
  estStatNames,
  searchableArmorStatNames,
  statHashByName,
  weaponStatNames,
} from 'app/search/search-filter-values';
import { generateGroupedSuggestionsForFilter } from 'app/search/suggestions-generation';
import { mapValues, maxOf, sumBy } from 'app/utils/collections';
import { getStatValuesByHash, isClassCompatible } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { once } from 'es-toolkit';
import { ItemFilterDefinition } from '../item-filter-types';

const validateStat: ItemFilterDefinition['validateStat'] = (filterContext) => {
  const customStatLabels = filterContext?.customStats?.map((c) => c.shortLabel) ?? [];
  const possibleStatNames = [...allAtomicStats, ...customStatLabels];
  return (stat) =>
    possibleStatNames.includes(stat) ||
    stat.split(/&|\+/).every((s) => s !== 'any' && possibleStatNames.includes(s));
};

// filters that operate on stats, several of which calculate values from all items beforehand
const statFilters: ItemFilterDefinition[] = [
  {
    keywords: 'stat',
    // t('Filter.StatsExtras')
    description: tl('Filter.Stats'),
    format: 'stat',
    suggestionsGenerator: ({ customStats }) =>
      generateGroupedSuggestionsForFilter(
        {
          keywords: 'stat',
          format: 'stat',
          suggestions: [...allAtomicStats, ...(customStats?.map((c) => c.shortLabel) ?? [])],
        },
        {},
      ),
    validateStat,
    filter: ({ filterValue, compare, customStats }) =>
      statFilterFromString(filterValue, compare!, customStats),
  },
  {
    keywords: 'basestat',
    // t('Filter.StatsExtras')
    description: tl('Filter.StatsBase'),
    format: 'stat',
    // Note: weapons of the same hash also have the same base stats, so this is only useful for
    // armor really, so the suggestions only list armor stats. But `validateStats` does allow
    // other stats too because there's no good reason to forbid it...
    suggestionsGenerator: ({ customStats }) =>
      generateGroupedSuggestionsForFilter(
        {
          keywords: 'basestat',
          format: 'stat',
          suggestions: [
            ...searchableArmorStatNames,
            ...estStatNames,
            ...(customStats?.map((c) => c.shortLabel) ?? []),
          ],
        },
        {},
      ),
    validateStat,
    filter: ({ filterValue, compare, customStats }) =>
      statFilterFromString(filterValue, compare!, customStats, true),
  },
  {
    // looks for a loadout (simultaneously equippable) maximized for this stat
    keywords: 'maxstatloadout',
    description: tl('Filter.StatsLoadout'),
    format: 'query',
    suggestions: Object.keys(dimArmorStatHashByName),
    destinyVersion: 2,
    filter: ({ filterValue, stores, allItems }) => {
      const maxStatLoadout = findMaxStatLoadout(stores, allItems, filterValue);
      return (item) => {
        // filterValue stat must exist, and this must be armor
        if (!item.bucket.inArmor || !statHashByName[filterValue]) {
          return false;
        }
        return maxStatLoadout.includes(item.id);
      };
    },
  },
  {
    keywords: 'maxstatvalue',
    description: tl('Filter.StatsMax'),
    format: 'query',
    suggestions: searchableArmorStatNames,
    destinyVersion: 2,
    filter: ({ filterValue, allItems }) => {
      const highestStatsPerSlotPerTier = gatherHighestStats(allItems);
      return (item: DimItem) =>
        checkIfStatMatchesMaxValue(highestStatsPerSlotPerTier, item, filterValue);
    },
  },
  {
    keywords: 'maxbasestatvalue',
    description: tl('Filter.StatsMax'),
    format: 'query',
    suggestions: searchableArmorStatNames,
    destinyVersion: 2,
    filter: ({ filterValue, allItems }) => {
      const highestStatsPerSlotPerTier = gatherHighestStats(allItems);
      return (item: DimItem) =>
        checkIfStatMatchesMaxValue(highestStatsPerSlotPerTier, item, filterValue, true);
    },
  },
  {
    keywords: 'maxpowerloadout',
    description: tl('Filter.MaxPowerLoadout'),
    destinyVersion: 2,
    filter: ({ stores, allItems }) => {
      const maxPowerLoadoutItems = calculateMaxPowerLoadoutItems(stores, allItems);
      return (item: DimItem) => maxPowerLoadoutItems.includes(item.id);
    },
  },
  {
    keywords: ['maxpower', 'accountmaxpower'],
    description: tl('Filter.MaxPower'),
    destinyVersion: 2,
    filter: ({ allItems, filterValue }) => {
      const classMatters = filterValue === 'maxpower';
      const maxPowerPerBucket = calculateMaxPowerPerBucket(allItems, classMatters);
      return (item: DimItem) =>
        // items can be 0pl but king of their own little kingdom,
        // like halloween masks, so let's exclude 0pl
        Boolean(item.power) && maxPowerPerBucket[maxPowerKey(item, classMatters)] <= item.power;
    },
  },
];

export default statFilters;

/**
 * given a stat name, this returns a FilterDefinition for comparing that stat
 */
function statFilterFromString(
  statNames: string,
  compare: (value: number) => boolean,
  customStats: CustomStatDef[],
  byBaseValue = false,
): (item: DimItem) => boolean {
  // this will be used to index into the right property of a DimStat
  const byWhichValue = byBaseValue ? 'base' : 'value';

  // a special case filter where we check for any single (natural) stat matching the comparator
  if (statNames === 'any') {
    const statMatches = (s: DimStat) =>
      armorAnyStatHashes.includes(s.statHash) && compare(s[byWhichValue]);
    return (item) => Boolean(item.stats?.find(statMatches));
  } else if (statNames in est) {
    return (item) => {
      if (!item.bucket.inArmor || !item.stats) {
        return false;
      }
      const sortedStats = item.stats
        .filter((s) => armorAnyStatHashes.includes(s.statHash))
        .map((s) => s[byWhichValue])
        .sort((a, b) => b - a);
      return compare(sortedStats[est[statNames as keyof typeof est]]);
    };
  } else if (weaponStatNames.includes(statNames)) {
    // return earlier for weapon stats. these shouldn't do addition/averaging.
    const statHash = statHashByName[statNames];
    return (item) => {
      const statValuesByHash = getStatValuesByHash(item, byWhichValue);
      return compare(statValuesByHash[statHash] || 0);
    };
  }
  const statCombiner = createStatCombiner(statNames, byWhichValue, customStats);
  // the filter computes combined values of requested stats and runs the total against comparator
  return (item) => Boolean(item.bucket.inArmor) && compare(statCombiner(item));
}

// converts the string "mobility+strength&discipline" into a function which
// returns an item's MOB + average( STR, DIS )
// this should only be run on armor stats
function createStatCombiner(
  statString: string,
  byWhichValue: 'base' | 'value',
  customStats: CustomStatDef[],
) {
  // an array of arrays of stat retrieval functions.
  // inner arrays are averaged, then outer array is totaled
  const nestedAddends = statString.split('+').map((addendString) => {
    const averagedHashes = addendString.split('&').map((statName) => {
      // Support "highest&secondhighest"
      if (statName in est) {
        return (
          statValuesByHash: NodeJS.Dict<number>,
          sortStats: () => number[][],
          item: DimItem,
        ) => {
          if (!item.bucket.inArmor || !item.stats) {
            return 0;
          }
          const sortedStats = sortStats();
          const statHash = sortedStats[est[statName as keyof typeof est]][0];
          if (!statHash) {
            throw new Error(`invalid stat name: "${statName}"`);
          }
          return statValuesByHash[statHash] || 0;
        };
      }

      const statHash = statHashByName[statName];
      // if we found a statHash here, this is a normal real stat, like discipline
      if (statHash) {
        // would ideally be "?? 0" but polyfills are big and || works fine
        return (statValuesByHash: NodeJS.Dict<number>) => statValuesByHash[statHash] || 0;
      }

      // custom stats this string represents
      const namedCustomStats = customStats.filter((c) => c.shortLabel === statName);

      if (namedCustomStats.length) {
        return (statValuesByHash: NodeJS.Dict<number>, _: any, item: DimItem) => {
          const thisClassCustomStat = namedCustomStats.find((c) =>
            isClassCompatible(c.class, item.classType),
          );
          // if this item's guardian class doesn't have a custom stat named statName
          // return false to not match
          if (!thisClassCustomStat) {
            return 0;
          }

          // otherwise, check the stat value against this custom stat's value
          return statValuesByHash[thisClassCustomStat.statHash] || 0;
        };
      }

      throw new Error(`invalid stat name: "${statName}"`);
    });
    return averagedHashes;
  });

  return (item: DimItem) => {
    const statValuesByHash = getStatValuesByHash(item, byWhichValue);
    // Computed lazily
    const sortStats = once(() =>
      (item.stats ?? [])
        .filter((s) => armorAnyStatHashes.includes(s.statHash))
        .map((s) => [s.statHash, s[byWhichValue]])
        .sort((a, b) => b[1] - a[1]),
    );

    return sumBy(nestedAddends, (averageGroup) => {
      const averaged =
        sumBy(averageGroup, (statFn) => statFn(statValuesByHash, sortStats, item)) /
        averageGroup.length;

      return averaged;
    });
  };
}

function findMaxStatLoadout(stores: DimStore[], allItems: DimItem[], statName: string) {
  const maxStatHash = statHashByName[statName];
  return stores.flatMap((store) =>
    // Accessing id is safe: maxStatLoadout only includes items with a power level,
    // i.e. only weapons and armor and those are instanced.
    maxStatLoadout(maxStatHash, allItems, store).items.map((i) => i.id),
  );
}

type MaxValuesDict = Record<
  'all' | 'nonexotic',
  { [slotName: string]: { [statHash: string]: { value: number; base: number } } }
>;

/** given our known max stat dict, see if this item and stat are among the max stat havers */
function checkIfStatMatchesMaxValue(
  maxStatValues: MaxValuesDict,
  item: DimItem,
  statName: string,
  byBaseValue = false,
) {
  // this must be armor with stats
  if (!item.bucket.inArmor || !item.stats) {
    return false;
  }
  const statHashes: number[] = statName === 'any' ? armorStatHashes : [statHashByName[statName]];
  const byWhichValue = byBaseValue ? 'base' : 'value';
  const useWhichMaxes = item.isExotic ? 'all' : 'nonexotic';
  const itemSlot = `${item.bucket.hash}|${item.classType}`;
  const maxStatsForSlot = maxStatValues[useWhichMaxes][itemSlot];
  const matchingStats = item.stats?.filter(
    (s) =>
      statHashes.includes(s.statHash) &&
      s[byWhichValue] === maxStatsForSlot?.[s.statHash][byWhichValue],
  );
  return matchingStats && Boolean(matchingStats.length);
}

function gatherHighestStats(allItems: DimItem[]) {
  const maxStatValues: MaxValuesDict = { all: {}, nonexotic: {} };

  for (const i of allItems) {
    // we only want armor with stats
    if (!i.bucket.inArmor || !i.stats) {
      continue;
    }

    const itemSlot = `${i.bucket.hash}|${i.classType}`;
    // if this is an exotic item, update overall maxes, but don't ruin the curve for the nonexotic maxes
    const itemTiers: ('all' | 'nonexotic')[] = i.isExotic ? ['all'] : ['all', 'nonexotic'];
    const thisSlotMaxGroups = itemTiers.map((t) => (maxStatValues[t][itemSlot] ??= {}));

    for (const stat of i.stats) {
      for (const thisSlotMaxes of thisSlotMaxGroups) {
        const thisSlotThisStatMaxes = (thisSlotMaxes[stat.statHash] ??= {
          value: 0,
          base: 0,
        });
        thisSlotThisStatMaxes.value = Math.max(thisSlotThisStatMaxes.value, stat.value);
        thisSlotThisStatMaxes.base = Math.max(thisSlotThisStatMaxes.base, stat.base);
      }
    }
  }
  return maxStatValues;
}

function calculateMaxPowerLoadoutItems(stores: DimStore[], allItems: DimItem[]) {
  return stores.flatMap((store) => maxLightItemSet(allItems, store).equippable.map((i) => i.id));
}

function maxPowerKey(item: DimItem, classMatters: boolean) {
  return `${item.bucket.hash}-${classMatters && item.bucket.inArmor ? item.classType : ''}`;
}

function calculateMaxPowerPerBucket(allItems: DimItem[], classMatters: boolean) {
  // disregard no-class armor
  const validItems = allItems.filter((i) => i.classType !== DestinyClass.Classified);
  const allItemsByBucketClass = Object.groupBy(validItems, (i) => maxPowerKey(i, classMatters));
  return mapValues(allItemsByBucketClass, (items) =>
    items.length ? maxOf(items, (i) => i.power) : 0,
  );
}
