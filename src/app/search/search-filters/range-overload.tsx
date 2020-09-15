import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import seasonTags from 'data/d2/season-tags.json';
import { energyCapacityTypeNames, energyNamesByEnum } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { generateSuggestionsForFilter } from '../search-config';
import { allStatNames, statHashByName } from '../search-filter-values';
import { rangeStringToComparator } from './range-numeric';

/** matches a filterValue that's probably a math check */
const mathCheck = /^[\d<>=]/;

// prioritize newer seasons. nobody is looking for "redwar" at this point
const seasonTagNames = Object.keys(seasonTags).reverse();

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
    suggestionsGenerator: () => generateSuggestionsForFilter({ keywords: 'masterwork' }),
    filter: ({ filterValue }) => {
      // the "is:masterwork" case
      if (filterValue === 'masterwork') {
        return (item) => item.masterwork;
      }
      // "masterwork:<5" case
      if (mathCheck.test(filterValue)) {
        const numberComparisonFunction = rangeStringToComparator(filterValue);
        return (item) =>
          Boolean(
            item.masterworkInfo?.tier &&
              numberComparisonFunction(Math.min(item.masterworkInfo.tier, 10))
          );
      }
      // "masterwork:range" case
      const searchedMasterworkStatHash = statHashByName[filterValue];
      return (item) =>
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
        return (item: DimItem) =>
          item.energy && numberComparisonFunction(item.energy.energyCapacity);
      }
      return (item: DimItem) =>
        item.energy && filterValue === energyNamesByEnum[item.energy.energyType];
    },
  },
  {
    keywords: 'season',
    description: tl('Filter.Season'),
    format: 'rangeoverload',
    destinyVersion: 2,
    suggestions: seasonTagNames,
    filter: ({ filterValue }) => {
      filterValue = replaceSeasonTagWithNumber(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item: DimItem) => compareTo(getSeason(item));
    },
  },
  {
    keywords: 'sunsetsafter',
    description: tl('Filter.SunsetAfter'),
    format: 'rangeoverload',
    destinyVersion: 2,
    suggestions: seasonTagNames,
    filter: ({ filterValue }) => {
      filterValue = replaceSeasonTagWithNumber(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item: DimItem) => {
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
