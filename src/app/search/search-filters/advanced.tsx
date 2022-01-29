import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory-stores/item-types';
import { FilterDefinition } from '../filter-types';

const advancedFilters: FilterDefinition[] = [
  {
    keywords: 'id',
    description: tl('Filter.ItemId'),
    format: 'freeform',
    filter:
      ({ filterValue }) =>
      (item) =>
        item.id === filterValue,
  },
  {
    keywords: 'hash',
    description: tl('Filter.ItemHash'),
    format: 'freeform',
    filter: ({ filterValue }) => {
      const itemHash = parseInt(filterValue, 10);
      return (item: DimItem) => item.hash === itemHash;
    },
  },
];

export default advancedFilters;
