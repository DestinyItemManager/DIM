import { tl } from 'app/i18next-t';
import { getItemKillTrackerInfo, getItemYear } from 'app/utils/item-utils';
import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';
import { FilterDefinition } from '../filter-types';
import { generateSuggestionsForFilter } from '../search-utils';

const rangeStringRegex = /^([<=>]{0,2})(\d+|hardcap|softcap)$/;

export function rangeStringToComparator(rangeString?: string, powerKeywords = false) {
  if (!rangeString) {
    throw new Error('Missing range comparison');
  }
  const matchedRangeString = rangeString.match(rangeStringRegex);
  if (!matchedRangeString) {
    throw new Error("Doesn't match our range comparison syntax");
  }

  const [, operator, comparisonValueString] = matchedRangeString;
  let comparisonValue = parseFloat(comparisonValueString);
  /* t('Filter.PowerKeywords') */
  if (powerKeywords && comparisonValueString === 'hardcap') {
    comparisonValue = D2SeasonInfo[D2CalculatedSeason].maxPower;
  } else if (powerKeywords && comparisonValueString === 'softcap') {
    comparisonValue = D2SeasonInfo[D2CalculatedSeason].softCap;
  }

  switch (operator) {
    case '=':
    case '':
      return (compare: number) => compare === comparisonValue;
    case '<':
      return (compare: number) => compare < comparisonValue;
    case '<=':
      return (compare: number) => compare <= comparisonValue;
    case '>':
      return (compare: number) => compare > comparisonValue;
    case '>=':
      return (compare: number) => compare >= comparisonValue;
  }
  throw new Error('Unknown range operator ' + operator);
}

const simpleRangeFilters: FilterDefinition[] = [
  {
    keywords: 'stack',
    description: tl('Filter.StackLevel'),
    format: 'range',
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => compareTo(item.amount);
    },
  },
  {
    keywords: ['light', 'power'],
    description: tl('Filter.PowerLevel'),
    format: 'range',
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue, true);
      return (item) => item.primStat && compareTo(item.primStat.value);
    },
  },
  {
    keywords: 'year',
    description: tl('Filter.Year'),
    format: 'range',
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => compareTo(getItemYear(item) ?? 0);
    },
  },
  {
    keywords: 'level',
    description: tl('Filter.RequiredLevel'),
    format: 'range',
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => compareTo(item.equipRequiredLevel);
    },
  },
  {
    keywords: 'powerlimit',
    description: tl('Filter.PowerLimit'),
    format: 'range',
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue, true);
      return (item) =>
        // anything with no powerCap has no known limit, so treat it like it's 99999999
        compareTo(item.powerCap ?? 99999999);
    },
  },
  {
    keywords: 'kills',
    description: tl('Filter.MasterworkKills'),
    format: 'range',
    destinyVersion: 2,
    suggestions: ['pve', 'pvp'],
    suggestionsGenerator: () =>
      generateSuggestionsForFilter({ keywords: 'kills', format: 'range' }),
    filter: ({ filterValue }) => {
      const parts = filterValue.split(':');
      const [count, ...[activityType, shouldntExist]] = [parts.pop(), ...parts];

      if (shouldntExist) {
        throw new Error('Too many filter parameters.');
      }

      const numberComparisonFunction = rangeStringToComparator(count);
      return (item) => {
        const killTrackerInfo = getItemKillTrackerInfo(item);
        return Boolean(
          count &&
            killTrackerInfo &&
            (!activityType || activityType === killTrackerInfo.type) &&
            numberComparisonFunction(killTrackerInfo.count)
        );
      };
    },
  },
];

export default simpleRangeFilters;
