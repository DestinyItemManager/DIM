import { tl } from 'app/i18next-t';
import { getSeason } from 'app/inventory/store/season';
import { powerLevelByKeyword } from 'app/search/power-levels';
import { allStatNames, statHashByName } from 'app/search/search-filter-values';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import seasonTags from 'data/d2/season-tags.json';
import { ItemFilterDefinition } from '../item-filter-types';

export const seasonTagToNumber = {
  ...seasonTags,
  next: D2CalculatedSeason + 1,
  current: D2CalculatedSeason,
};

// overloadedRangeFilters: stuff that may test a range, but also accepts a word

// this word might become a number like arrival ====> 11,
// then be processed normally in a number check

const overloadedRangeFilters: ItemFilterDefinition[] = [
  {
    keywords: 'masterwork',
    description: tl('Filter.Masterwork'),
    format: ['simple', 'query', 'range'],
    destinyVersion: 2,
    suggestions: allStatNames,
    filter: ({ lhs, filterValue, compare }) => {
      // the "is:masterwork" case
      if (lhs === 'is') {
        return (item) => item.masterwork;
      }
      // "masterwork:<5" case
      if (compare) {
        return (item) => Boolean(item.masterworkInfo?.tier && compare(item.masterworkInfo.tier));
      }
      // "masterwork:range" case
      const searchedMasterworkStatHash = statHashByName[filterValue];
      return (item) =>
        Boolean(
          item.masterworkInfo?.stats?.some(
            (s) => filterValue === 'any' || (s.isPrimary && s.hash === searchedMasterworkStatHash),
          ),
        );
    },
  },
  {
    keywords: 'energycapacity',
    description: tl('Filter.Energy'),
    format: 'range',
    destinyVersion: 2,
    filter:
      ({ compare }) =>
      (item) =>
        item.energy && compare!(item.energy.energyCapacity),
  },
  {
    keywords: 'season',
    description: tl('Filter.Season'),
    format: 'range',
    destinyVersion: 2,
    overload: Object.fromEntries(Object.entries(seasonTagToNumber).reverse()),
    filter:
      ({ compare }) =>
      (item) =>
        compare!(getSeason(item)),
  },
  {
    keywords: ['light', 'power'],
    /* t('Filter.PowerKeywords') */
    description: tl('Filter.PowerLevel'),
    format: 'range',
    overload: powerLevelByKeyword,
    filter:
      ({ compare }) =>
      (item) =>
        Boolean(item.power && compare!(item.power)),
  },
  {
    keywords: 'powerlimit',
    description: tl('Filter.Deprecated'),
    format: 'range',
    overload: powerLevelByKeyword,
    destinyVersion: 2,
    deprecated: true,
    filter:
      ({ compare }) =>
      () =>
        // no items are sunset, they all have effectively unlimited caps. The
        // manifest specifies this cap or something similar for almost
        // everything:
        compare!(999990),
  },
];

export default overloadedRangeFilters;
