import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';
import seasonTags from 'data/d2/season-tags.json';
import { energyCapacityTypeNames, energyNamesByEnum } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { allStatNames, statHashByName } from '../search-filter-values';
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

// shortcuts for power numbers
const powerLevelByKeyword = {
  powerfloor: D2SeasonInfo[D2CalculatedSeason].powerFloor,
  softcap: D2SeasonInfo[D2CalculatedSeason].softCap,
  powerfulcap: D2SeasonInfo[D2CalculatedSeason].powerfulCap,
  pinnaclecap: D2SeasonInfo[D2CalculatedSeason].pinnacleCap,
};
const powerLevelKeywords = Object.keys(powerLevelByKeyword);
// TO DATE, things cannot cap at anything but pinnacle limits
const powerCapKeywords = ['pinnaclecap'];

// overloadedRangeFilters: stuff that may test a range, but also accepts a word

// this word might become a number like arrival ====> 11,
// then be processed normally in a number check

const overloadedRangeFilters: FilterDefinition[] = [
  {
    keywords: 'masterwork',
    description: tl('Filter.Masterwork'),
    format: ['simple', 'query', 'range'],
    destinyVersion: 2,
    suggestions: allStatNames,
    filter: ({ filterValue }) => {
      filterValue = filterValue.toLowerCase();
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
    format: ['range', 'query'],
    destinyVersion: 2,
    suggestions: energyCapacityTypeNames,
    filter: ({ filterValue }) => {
      filterValue = filterValue.toLowerCase();
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
      filterValue = filterValue.toLowerCase();
      filterValue = replaceSeasonTagWithNumber(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item: DimItem) => compareTo(getSeason(item));
    },
  },
  {
    keywords: ['light', 'power'],
    /* t('Filter.PowerKeywords') */
    description: tl('Filter.PowerLevel'),
    format: 'rangeoverload',
    suggestions: powerLevelKeywords,
    filter: ({ filterValue }) => {
      filterValue = filterValue.toLowerCase();
      filterValue = replacePowerLevelKeyword(filterValue);
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => Boolean(item.power && compareTo(item.power));
    },
  },
  {
    keywords: 'powerlimit',
    /* t('Filter.PowerKeywords') */
    description: tl('Filter.PowerLimit'),
    format: 'rangeoverload',
    suggestions: powerCapKeywords,
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      filterValue = filterValue.toLowerCase();
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
