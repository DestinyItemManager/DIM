import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const advancedFilters: FilterDefinition[] = [
  {
    keywords: ['id'],
    description: [tl('find an item by id')],
    format: 'freeform',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) => item.id === filterValue,
  },
  {
    keywords: ['hash'],
    description: [tl('find an item by hash')],
    format: 'freeform',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) => item.hash.toString() === filterValue,
  },
];

export default advancedFilters;
