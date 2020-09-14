import { tl } from 'app/i18next-t';
import { D2Item } from 'app/inventory/item-types';
import { getItemYear } from 'app/utils/item-utils';
import _ from 'lodash';
import { FilterDefinition } from '../filter-types';

const rangeStringRegex = /^([<=>]{0,2})(\d+)$/;

export function rangeStringToComparator(rangeString: string) {
  if (!rangeString) {
    return _.stubFalse;
  }
  const matchedRangeString = rangeString.match(rangeStringRegex);
  if (!matchedRangeString) {
    return _.stubFalse;
  }

  const [, operator, comparisonValueString] = matchedRangeString;
  const comparisonValue = parseFloat(comparisonValueString);

  switch (operator) {
    case 'none':
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
  return _.stubFalse;
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
      const compareTo = rangeStringToComparator(filterValue);
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
      const compareTo = rangeStringToComparator(filterValue);
      return (item: D2Item) =>
        // anything with no powerCap has no known limit, so treat it like it's 99999999
        compareTo(item.powerCap ?? 99999999);
    },
  },
];

export default simpleRangeFilters;
