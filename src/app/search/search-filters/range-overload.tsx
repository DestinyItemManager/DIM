import { tl } from 'app/i18next-t';
import { D2Item } from 'app/inventory/item-types';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import seasonTags from 'data/d2/season-tags.json';
import { energyCapacityTypeNames, energyNamesByEnum } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { allStatNames, statHashByName } from '../search-filter-values';
import { rangeStringToComparator } from './range-numeric';

/** matches a filterValue that's probably a math check */
const mathCheck = /^[\d<>=]/;

const seasonTagNames = Object.keys(seasonTags);

// overloadedRangeFilters: stuff that may test a range, but also accepts a word

// this word might become a number like arrival ====> 11,
// then be processed normally in a number check

// or the word might be checked differently than the number, like
// masterwork:handling is a completely different test from masterwork:>7
const overloadedRangeFilters: FilterDefinition[] = [
  {
    keywords: 'masterwork',
    description: tl('Filter.Masterwork'),
    format: 'rangeoverload',
    destinyVersion: 2,
    suggestions: allStatNames,
    filter: ({ filterValue }) => {
      if (mathCheck.test(filterValue)) {
        const numberComparisonFunction = rangeStringToComparator(filterValue);
        return (item: D2Item) =>
          Boolean(
            item.masterworkInfo?.tier &&
              numberComparisonFunction(Math.min(item.masterworkInfo.tier, 10))
          );
      }
      const searchedMasterworkStatHash = statHashByName[filterValue];
      return (item: D2Item) =>
        Boolean(
          searchedMasterworkStatHash &&
            item.masterworkInfo?.stats?.some((s) => s.hash === searchedMasterworkStatHash)
        );
    },
  },
  {
    keywords: 'energycapacity',
    description: tl('Filter.Energy'),
    format: 'rangeoverload',
    destinyVersion: 2,
    suggestions: energyCapacityTypeNames,
    filter: ({ filterValue }) => {
      if (mathCheck.test(filterValue)) {
        const numberComparisonFunction = rangeStringToComparator(filterValue);
        return (item: D2Item) =>
          item.energy && numberComparisonFunction(item.energy.energyCapacity);
      }
      return (item: D2Item) =>
        item.energy && filterValue === energyNamesByEnum[item.energy.energyType];
    },
  },
  {
    keywords: 'season',
    description: tl('Filter.Season'),
    format: 'range',
    destinyVersion: 2,
    suggestions: seasonTagNames,
    filter: ({ filterValue }) => {
      const compareTo = seasonRangeStringToComparator(filterValue);
      return (item: D2Item) => compareTo(item.season);
    },
  },
  {
    keywords: 'sunsetsafter',
    description: tl('Filter.SunsetAfter'),
    format: 'range',
    destinyVersion: 2,
    suggestions: seasonTagNames,
    filter: ({ filterValue }) => {
      const compareTo = seasonRangeStringToComparator(filterValue);
      return (item: D2Item) => {
        const itemFinalSeason = getItemPowerCapFinalSeason(item);
        return compareTo(itemFinalSeason ?? 0);
      };
    },
  },
];

export default overloadedRangeFilters;

/**
 * replaces a word with a corresponding season
 *
 * i.e. turns `<=forge` into `<=5`
 *
 * use only on simple filter values where there's not other letters
 */
function replaceSeasonTagWithNumber(s: string) {
  return s.replace(/[a-z]+$/i, (tag) => seasonTags[tag]);
}

/**
 * replaces a possible season keyword with its number, then returns usual math comparator
 */
function seasonRangeStringToComparator(rangeString: string) {
  return rangeStringToComparator(replaceSeasonTagWithNumber(rangeString));
}
