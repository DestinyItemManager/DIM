import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { maxLightItemSet, maxStatLoadout } from 'app/loadout/auto-loadouts';
import _ from 'lodash';
import { FilterDefinition } from '../filter-types';
import {
  allStatNames,
  armorAnyStatHashes,
  armorStatHashes,
  searchableArmorStatNames,
  statHashByName,
} from '../search-filter-values';
import { rangeStringToComparator } from './range-numeric';

// filters that operate on stats, several of which calculate values from all items beforehand
const statFilters: FilterDefinition[] = [
  {
    keywords: 'stat',
    description: tl('Filter.Stats'),
    format: 'range',
    suggestions: allStatNames,
    filter: ({ filterValue }) => statFilterFromString(filterValue),
  },
  {
    keywords: 'basestat',
    description: tl('Filter.StatsBase'),
    format: 'range',
    suggestions: searchableArmorStatNames,
    filter: ({ filterValue }) => statFilterFromString(filterValue, true),
  },
  {
    // looks for a loadout (simultaneously equippable) maximized for this stat
    keywords: 'maxstatloadout',
    description: tl('Filter.StatsLoadout'),
    format: 'query',
    suggestions: searchableArmorStatNames,
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
      const highestStatsPerSlot = gatherHighestStatsPerSlot(allItems);
      return (item: DimItem) => checkIfHasMaxStatValue(highestStatsPerSlot, item, filterValue);
    },
  },
  {
    keywords: 'maxbasestatvalue',
    description: tl('Filter.StatsMax'),
    format: 'query',
    suggestions: searchableArmorStatNames,
    destinyVersion: 2,
    filter: ({ filterValue, allItems }) => {
      const highestStatsPerSlot = gatherHighestStatsPerSlot(allItems);
      return (item: DimItem) =>
        checkIfHasMaxStatValue(highestStatsPerSlot, item, filterValue, true);
    },
  },
  {
    keywords: 'maxpower',
    description: tl('Filter.MaxPower'),
    destinyVersion: 2,
    filter: ({ stores, allItems }) => {
      const maxPowerLoadoutItems = calculateMaxPowerLoadoutItems(stores, allItems);
      return (item: DimItem) => maxPowerLoadoutItems.includes(item.id);
    },
  },
];

export default statFilters;

/**
 * given a stat name, this returns a FilterDefinition for comparing that stat
 */
function statFilterFromString(
  filterValue: string,
  byBaseValue = false
): (item: DimItem) => boolean {
  const [statNames, statValue, shouldntExist] = filterValue.split(':');

  // we are looking for, at most, 3 colon-separated sections in the overall text:
  // stat                   mobility                    >=5
  // and one was already removed ("stat"), so bail if there's more than 1 colon left
  if (shouldntExist) {
    throw new Error('Too many segments');
  }

  const numberComparisonFunction = rangeStringToComparator(statValue);

  // this will be used to index into the right property of a DimStat
  const byWhichValue = byBaseValue ? 'base' : 'value';

  // a special case filter where we check for any single stat matching the comparator
  if (statNames === 'any') {
    return (item) =>
      Boolean(
        item.stats?.find(
          (s) =>
            armorAnyStatHashes.includes(s.statHash) && numberComparisonFunction(s[byWhichValue])
        )
      );
  }

  // convert stat names to stathashes and verify they all resolved to a valid hash
  const statHashes: number[] = statNames.split('+').map((s) => statHashByName[s]);
  if (!statHashes.every((s) => s)) {
    throw new Error(`stathash lookup failed: ${statNames}`);
  }

  // the filter tallies combined values of requested stats and runs the total against comparator
  return (item) => {
    const matchingStats = item.stats?.filter((s) => statHashes.includes(s.statHash));
    const total = _.sumBy(matchingStats, (s) => s[byWhichValue]);
    return numberComparisonFunction(total);
  };
}

function findMaxStatLoadout(stores: DimStore[], allItems: DimItem[], statName: string) {
  const maxStatHash = statHashByName[statName];
  return stores.flatMap((store) =>
    maxStatLoadout(maxStatHash, allItems, store).items.map((i) => i.id)
  );
}

function checkIfHasMaxStatValue(
  maxStatValues: {
    [key: string]: { [key: string]: { value: number; base: number } };
  },
  item: DimItem,
  statName: string,
  byBaseValue = false
) {
  // filterValue stat must exist, and this must be armor
  if (!item.bucket.inArmor || !item.stats) {
    return false;
  }
  const statHashes: number[] = statName === 'any' ? armorStatHashes : [statHashByName[statName]];
  const byWhichValue = byBaseValue ? 'base' : 'value';
  const itemSlot = `${item.classType}${item.type}`;
  const matchingStats = item.stats?.filter(
    (s) =>
      statHashes.includes(s.statHash) &&
      s[byWhichValue] === maxStatValues[itemSlot][s.statHash][byWhichValue]
  );
  return matchingStats && Boolean(matchingStats.length);
}

function gatherHighestStatsPerSlot(allItems: DimItem[]) {
  const maxStatValues: {
    [key: string]: { [key: string]: { value: number; base: number } };
  } | null = {};
  for (const i of allItems) {
    if (!i.bucket.inArmor || !i.stats) {
      continue;
    }
    const itemSlot = `${i.classType}${i.type}`;
    if (!(itemSlot in maxStatValues)) {
      maxStatValues[itemSlot] = {};
    }
    if (i.stats) {
      for (const stat of i.stats) {
        if (armorStatHashes.includes(stat.statHash)) {
          maxStatValues[itemSlot][stat.statHash] =
            // just assign if this is the first
            !(stat.statHash in maxStatValues[itemSlot])
              ? { value: stat.value, base: stat.base }
              : // else we are looking for the biggest stat
                {
                  value: Math.max(maxStatValues[itemSlot][stat.statHash].value, stat.value),
                  base: Math.max(maxStatValues[itemSlot][stat.statHash].base, stat.base),
                };
        }
      }
    }
  }
  return maxStatValues;
}

function calculateMaxPowerLoadoutItems(stores: DimStore[], allItems: DimItem[]) {
  return stores.flatMap((store) => maxLightItemSet(allItems, store).equippable.map((i) => i.id));
}
