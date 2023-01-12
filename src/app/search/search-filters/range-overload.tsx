import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import seasonTags from 'data/d2/season-tags.json';
import {
  energyCapacityTypeNames,
  energyNamesByEnum,
  powerLevelByKeyword,
} from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { allStatNames, statHashByName } from '../search-filter-values';

const seasonTagToNumber = {
  ...seasonTags,
  next: D2CalculatedSeason + 1,
  current: D2CalculatedSeason,
};

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
            (s) => filterValue === 'any' || s.hash === searchedMasterworkStatHash
          )
        );
    },
  },
  {
    keywords: 'energycapacity',
    description: tl('Filter.Energy'),
    format: ['range', 'query'],
    destinyVersion: 2,
    suggestions: energyCapacityTypeNames,
    filter: ({ filterValue, compare }) => {
      if (compare) {
        return (item: DimItem) => item.energy && compare(item.energy.energyCapacity);
      }
      return (item: DimItem) =>
        item.energy && filterValue === energyNamesByEnum[item.energy.energyType];
    },
  },
  {
    keywords: 'season',
    description: tl('Filter.Season'),
    format: 'range',
    destinyVersion: 2,
    overload: Object.fromEntries(Object.entries(seasonTagToNumber).reverse()),
    filter:
      ({ compare }) =>
      (item: DimItem) =>
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
    /* t('Filter.PowerKeywords') */
    description: tl('Filter.PowerLimit'),
    format: 'range',
    overload: powerLevelByKeyword,
    destinyVersion: 2,
    filter:
      ({ compare }) =>
      (item) =>
        // anything with no powerCap has no known limit, so treat it like it's 99999999
        compare!(item.powerCap ?? 99999999),
  },
];

export default overloadedRangeFilters;
