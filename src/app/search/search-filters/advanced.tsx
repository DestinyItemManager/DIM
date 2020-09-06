import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const advancedFilters: FilterDefinition[] = [
  {
    keywords: 'id',
    description: tl('Filters.ItemId'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => (item) => item.id === filterValue,
  },
  {
    keywords: 'hash',
    description: tl('Filters.ItemHash'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => {
      const itemHash = parseInt(filterValue, 10);
      return (item: DimItem) => item.hash === itemHash;
    },
  },
];

export default advancedFilters;
