import { tl } from 'app/i18next-t';
import { D2Item, DimItem } from 'app/inventory/item-types';
import { maxLightItemSet, maxStatLoadout } from 'app/loadout/auto-loadouts';
import _ from 'lodash';
import { FilterDefinition } from '../filter-types';
import {
  armorAnyStatHashes,
  armorStatHashes,
  searchableStatNames,
  statHashByName,
} from '../search-filter-values';
import { rangeStringToComparator } from './range-numeric';

let _maxStatValues: {
  [key: string]: { [key: string]: { value: number; base: number } };
} | null = null;
const _maxStatLoadoutItems: { [key: string]: string[] } = {};

let _maxPowerLoadoutItems: string[] = [];

// filters that operate on stats, several of which calculate values from all items beforehand
const statFilters: FilterDefinition[] = [
  {
    keywords: ['stat'],
    description: [tl('Filter.Stats')],
    format: 'range',
    suggestionsGenerator: searchableStatNames,
    destinyVersion: 0,
    filterValuePreprocessor: (filterValue: string) => statFilterFromString(filterValue),
  },
  {
    keywords: ['basestat'],
    description: [tl('Filter.StatsBase')],
    format: 'range',
    suggestionsGenerator: searchableStatNames,
    destinyVersion: 0,
    filterValuePreprocessor: (filterValue: string) => statFilterFromString(filterValue, true),
  },
  {
    // looks for a loadout (simultaneously equippable) maximized for this stat
    keywords: ['maxstatloadout'],
    description: [tl('Filter.StatsLoadout')],
    format: 'query',
    suggestionsGenerator: searchableStatNames,
    destinyVersion: 2,
    contextGenerator: findMaxStatLoadout,
    filterFunction: (item: D2Item, filterValue: string) => {
      // filterValue stat must exist, and this must be armor
      if (!item.bucket.inArmor || !statHashByName[filterValue]) {
        return false;
      }
      return _maxStatLoadoutItems[filterValue]?.includes(item.id);
    },
  },
  {
    keywords: ['maxstatvalue'],
    description: [tl('Filter.StatsMax')],
    format: 'query',
    suggestionsGenerator: searchableStatNames,
    destinyVersion: 2,
    contextGenerator: gatherHighestStatsPerSlot,
    filterFunction: (item: D2Item, filterValue: string) =>
      checkIfHasMaxStatValue(item, filterValue),
  },
  {
    keywords: ['maxbasestatvalue'],
    description: [tl('Filter.StatsMax')],
    format: 'query',
    suggestionsGenerator: searchableStatNames,
    destinyVersion: 2,
    contextGenerator: gatherHighestStatsPerSlot,
    filterFunction: (item: D2Item, filterValue: string) =>
      checkIfHasMaxStatValue(item, filterValue, true),
  },
  {
    keywords: ['maxpower'],
    description: [tl('Filter.MaxPower')],
    format: 'simple',
    destinyVersion: 2,
    contextGenerator: calculateMaxPowerLoadoutItems,
    filterFunction: (item: DimItem) => _maxPowerLoadoutItems.includes(item.id),
  },
];

export default statFilters;

/**
 * given a stat name, this returns a FilterDefinition for comparing that stat
 */
function statFilterFromString(filterValue: string, byBaseValue = false) {
  const [statName, statValue, shouldntExist] = filterValue.split(':');

  // we are looking for, at most, 3 colons in the overall filter text,
  // and one was already removed, so bail if a 3rd element was found by split()
  if (shouldntExist) {
    return _.stubFalse;
  }
  const numberComparisonFunction = rangeStringToComparator(statValue);
  const byWhichValue = byBaseValue ? 'base' : 'value';
  const statHashes: number[] = statName === 'any' ? armorAnyStatHashes : [statHashByName[statName]];

  return (item: DimItem) => {
    const matchingStats = item.stats?.filter(
      (s) => statHashes.includes(s.statHash) && numberComparisonFunction(s[byWhichValue])
    );
    return Boolean(matchingStats?.length);
  };
}

function findMaxStatLoadout(allItems: DimItem[], statName: string) {
  const stores = allItems[0].getStoresService().getStores();
  const maxStatHash = statHashByName[statName];
  if (!_maxStatLoadoutItems[statName]) {
    _maxStatLoadoutItems[statName] = [];
  }
  if (!_maxStatLoadoutItems[statName].length) {
    stores.forEach((store) => {
      _maxStatLoadoutItems[statName].push(
        ...maxStatLoadout(maxStatHash, stores, store).items.map((i) => i.id)
      );
    });
  }
}

function checkIfHasMaxStatValue(item: D2Item, statName: string, byBaseValue = false) {
  // filterValue stat must exist, and this must be armor
  if (!item.bucket.inArmor || !item.isDestiny2() || !item.stats || !_maxStatValues) {
    return false;
  }
  const statHashes: number[] = statName === 'any' ? armorStatHashes : [statHashByName[statName]];
  const byWhichValue = byBaseValue ? 'base' : 'value';
  const itemSlot = `${item.classType}${item.type}`;
  const matchingStats = item.stats?.filter(
    (s) =>
      statHashes.includes(s.statHash) &&
      s[byWhichValue] === _maxStatValues![itemSlot][s.statHash][byWhichValue]
  );
  return matchingStats && Boolean(matchingStats.length);
}

function gatherHighestStatsPerSlot(allItems: DimItem[]) {
  const stores = allItems[0].getStoresService().getStores();
  if (_maxStatValues === null) {
    _maxStatValues = {};
    for (const store of stores) {
      for (const i of store.items) {
        if (!i.bucket.inArmor || !i.stats || !i.isDestiny2()) {
          continue;
        }
        const itemSlot = `${i.classType}${i.type}`;
        if (!(itemSlot in _maxStatValues)) {
          _maxStatValues[itemSlot] = {};
        }
        if (i.stats) {
          for (const stat of i.stats) {
            if (armorStatHashes.includes(stat.statHash)) {
              _maxStatValues[itemSlot][stat.statHash] =
                // just assign if this is the first
                !(stat.statHash in _maxStatValues[itemSlot])
                  ? { value: stat.value, base: stat.base }
                  : // else we are looking for the biggest stat
                    {
                      value: Math.max(_maxStatValues[itemSlot][stat.statHash].value, stat.value),
                      base: Math.max(_maxStatValues[itemSlot][stat.statHash].base, stat.base),
                    };
            }
          }
        }
      }
    }
  }
}

function calculateMaxPowerLoadoutItems(allItems: DimItem[]) {
  const stores = allItems[0].getStoresService().getStores();
  _maxPowerLoadoutItems = [];
  stores.forEach((store) => {
    _maxPowerLoadoutItems.push(...maxLightItemSet(stores, store).equippable.map((i) => i.id));
  });
}
