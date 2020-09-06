import { tl } from 'app/i18next-t';
import { D2Item, DimItem } from 'app/inventory/item-types';
import { D2SeasonInfo } from 'data/d2/d2-season-info';
import _ from 'lodash';
import { FilterDefinition } from '../filter-types';

const rangeStringRegex = /^[<=>]{0,2}$/;

export function rangeStringToComparator(rangeString: string) {
  const matchedRangeString = rangeString.match(rangeStringRegex);
  if (!matchedRangeString) {
    return _.stubFalse;
  }

  const [, operator, comparisonValueString] = matchedRangeString;
  const comparisonValue = parseFloat(comparisonValueString);

  switch (operator) {
    case 'none':
    case '=':
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
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: DimItem, filterValue: (compare: number) => boolean) =>
      filterValue(item.amount),
  },
  {
    keywords: 'light',
    description: tl('Filter.LightLevel'),
    format: 'range',
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: DimItem, filterValue: (compare: number) => boolean) =>
      item.primStat && filterValue(item.primStat.value),
  },
  {
    keywords: 'year',
    description: tl('Filter.Year'),
    format: 'range',
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: DimItem, filterValue: (compare: number) => boolean) => {
      if (item.isDestiny1()) {
        return filterValue(item.year);
      } else if (item.isDestiny2()) {
        return filterValue(D2SeasonInfo[item.season]?.year ?? 0);
      }
    },
  },
  {
    keywords: 'level',
    description: tl('Filter.RequiredLevel'),
    format: 'range',
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: DimItem, filterValue: (compare: number) => boolean) =>
      filterValue(item.equipRequiredLevel),
  },
  {
    keywords: 'powerlimit',
    description: tl('Filter.PowerLimit'),
    format: 'range',
    destinyVersion: 2,
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: D2Item, filterValue: (compare: number) => boolean) =>
      // anything with no powerCap has no known limit, so treat it like it's 99999999
      filterValue(item.powerCap ?? 99999999),
  },
];

export default simpleRangeFilters;
