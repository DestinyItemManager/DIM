import { tl } from 'app/i18next-t';
import { getItemKillTrackerInfo, getItemYear } from 'app/utils/item-utils';
import { FilterDefinition } from '../filter-types';

const rangeStringRegex = /^([<=>]{0,2})(\d+(?:\.\d+)?)$/;

export function rangeStringToComparator(rangeString?: string) {
  if (!rangeString) {
    throw new Error('Missing range comparison');
  }
  const matchedRangeString = rangeString.match(rangeStringRegex);
  if (!matchedRangeString) {
    throw new Error("Doesn't match our range comparison syntax");
  }

  const [, operator, comparisonValueString] = matchedRangeString;
  const comparisonValue = parseFloat(comparisonValueString);

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
    destinyVersion: 1,
    description: tl('Filter.RequiredLevel'),
    format: 'range',
    filter: ({ filterValue }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => compareTo(item.equipRequiredLevel);
    },
  },
  {
    keywords: 'kills',
    description: tl('Filter.MasterworkKills'),
    format: ['range', 'stat'],
    destinyVersion: 2,
    suggestions: ['pve', 'pvp'],
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
  {
    keywords: 'weaponlevel',
    description: tl('Filter.WeaponLevel'),
    format: 'range',
    destinyVersion: 2,
    filter:
      ({ filterValue }) =>
      (item) => {
        if (!item.craftedInfo) {
          return false;
        }
        const compareTo = rangeStringToComparator(filterValue);
        return compareTo(item.craftedInfo.level || 0);
      },
  },
];

export default simpleRangeFilters;
