import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { ItemFilterDefinition } from '../item-filter-types';

const advancedFilters: ItemFilterDefinition[] = [
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
