import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';
import seasonTags from 'data/d2/season-tags.json';
import { energyCapacityTypeNames, energyNamesByEnum } from '../d2-known-values';
import { FilterDefinition, FilterDeprecation } from '../filter-types';
import { allStatNames, statHashByName } from '../search-filter-values';
import { generateSuggestionsForFilter } from '../search-utils';
import { rangeStringToComparator } from './range-numeric';

/** matches a filterValue that's probably a math check */
const mathCheck = /^[\d<>=]/;

const seasonTagToNumber = {
  ...seasonTags,
  next: D2CalculatedSeason + 1,
  current: D2CalculatedSeason,
};

// prioritize newer seasons. nobody is looking for "redwar" at this point
const seasonTagNames = Object.keys(seasonTagToNumber).reverse();

// things can't sunset in season 11 and earlier
const sunsetSeasonTagNames = Object.entries(seasonTagToNumber)
  .filter(([_, num]) => num > 11)
  .map(([tag]) => tag)
  .reverse();

// shortcuts for power numbers
const powerLevelByKeyword = {
  softcap: D2SeasonInfo[D2CalculatedSeason].softCap,
  // powerfulcap: D2SeasonInfo[D2CalculatedSeason].?????,
  pinnaclecap: D2SeasonInfo[D2CalculatedSeason].maxPower,
};
const powerLevelKeywords = Object.keys(powerLevelByKeyword);
// TO DATE, things cannot cap at anything but pinnacle limits
const powerCapKeywords = ['pinnaclecap'];

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
          Boolean(item.masterworkInfo?.tier && numberComparisonFunction(item.masterworkInfo.tier));
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
    deprecated: FilterDeprecation.Deprecated,
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
  {
    keywords: 'sunsetsin',
    description: tl('Filter.Sunsets'),
    format: 'rangeoverload',
    destinyVersion: 2,
    suggestions: sunsetSeasonTagNames,
    filter: ({ filterValue }) => {
      filterValue = replaceSeasonTagWithNumber(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item: DimItem) => {
        // things without a final season will turn into 0 and eval false 2 lines down
        const sunsetSeason = (getItemPowerCapFinalSeason(item) ?? -1) + 1;
        return Boolean(sunsetSeason) && compareTo(sunsetSeason);
      };
    },
  },
  {
    keywords: ['light', 'power'],
    description: tl('Filter.PowerLevel'),
    format: 'rangeoverload',
    suggestions: powerLevelKeywords,
    filter: ({ filterValue }) => {
      filterValue = replacePowerLevelKeyword(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => item.primStat && compareTo(item.primStat.value);
    },
  },
  {
    keywords: 'powerlimit',
    description: tl('Filter.PowerLimit'),
    format: 'rangeoverload',
    suggestions: powerCapKeywords,
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      filterValue = replacePowerLevelKeyword(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item) =>
        // anything with no powerCap has no known limit, so treat it like it's 99999999
        compareTo(item.powerCap ?? 99999999);
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
  return s.replace(/[a-z]+$/i, (tag) => seasonTagToNumber[tag]);
}

const powerKeywordMatcher = new RegExp(powerLevelKeywords.join('|'));
/**
 * replaces a word with a corresponding power level
 *
 * use only on simple filter values where there's not other letters
 */
function replacePowerLevelKeyword(s: string) {
  return s.replace(powerKeywordMatcher, (tag) => powerLevelByKeyword[tag]);
}
