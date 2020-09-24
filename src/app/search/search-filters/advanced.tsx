import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';
import { stringToOperation } from './range-numeric';

const advancedFilters: FilterDefinition[] = [
  {
    keywords: 'id',
    description: tl('Filter.ItemId'),
    format: 'freeform',
    filter: ({ filterValue, allItems }) => {
      // eslint-disable-next-line prefer-const
      let [, operator, searchId] = filterValue.match(/^([<>])?(\d+)$/) ?? [];
      if (!searchId) {
        throw new Error('Missing range comparison');
      }
      searchId = searchId.padStart(20, '0');
      if (!operator) {
        return (item) => item.id === filterValue;
      }
      const allIds = [
        ...new Set([...allItems.map((i) => i.id.padStart(20, '0')), searchId]),
      ].sort();
      const searchIndex = allIds.indexOf(searchId);
      const operation = stringToOperation(operator);

      return (item) => {
        const itemIndex = allIds.indexOf(item.id.padStart(20, '0'));
        return operation(itemIndex, searchIndex);
      };
    },
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
