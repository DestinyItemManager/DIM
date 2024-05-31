import { tl } from 'app/i18next-t';
import { itemTagSelectorList } from 'app/inventory/dim-item-info';
import { ItemFilterDefinition } from '../item-filter-types';

// check item tags or presence of notes
const itemInfosFilters: ItemFilterDefinition[] = [
  {
    keywords: 'tagged',
    description: tl('Filter.Tags.Tagged'),
    filter:
      ({ getTag }) =>
      (item) =>
        getTag(item) !== undefined,
  },
  {
    keywords: 'tag',
    description: tl('Filter.Tags.Tag'),
    format: 'query',
    suggestions: itemTagSelectorList.map((tag) => tag.type ?? 'none'),
    filter:
      ({ filterValue, getTag }) =>
      (item) =>
        (getTag(item) || 'none') === filterValue,
  },
  {
    keywords: 'hasnotes',
    description: tl('Filter.HasNotes'),
    filter:
      ({ getNotes }) =>
      (item) =>
        Boolean(getNotes(item)),
  },
];

export default itemInfosFilters;
