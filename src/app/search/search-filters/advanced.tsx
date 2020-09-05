import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const advancedFilters: FilterDefinition[] = [
  {
    keywords: ['id'],
    description: [tl('Filters.ItemId')],
    format: 'freeform',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) => item.id === filterValue,
  },
  {
    keywords: ['hash'],
    description: [tl('Filters.ItemHash')],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: (filterValue) => parseInt(filterValue, 10),
    filterFunction: (item: DimItem, itemHash: number) => item.hash === itemHash,
  },
];

export default advancedFilters;
