import { tl } from 'app/i18next-t';
import { getNotes, getTag, itemTagSelectorList } from 'app/inventory-stores/dim-item-info';
import { FilterDefinition } from '../filter-types';

// check item tags or presence of notes
const itemInfosFilters: FilterDefinition[] = [
  {
    keywords: 'tagged',
    description: tl('Filter.Tags.Tagged'),
    filter:
      ({ itemInfos, itemHashTags }) =>
      (item) =>
        getTag(item, itemInfos, itemHashTags) !== undefined,
  },
  {
    keywords: 'tag',
    description: tl('Filter.Tags.Tag'),
    format: 'query',
    suggestions: itemTagSelectorList.map((tag) => tag.type ?? 'none'),
    filter:
      ({ filterValue, itemInfos, itemHashTags }) =>
      (item) =>
        (getTag(item, itemInfos, itemHashTags) || 'none') === filterValue,
  },
  {
    keywords: 'hasnotes',
    description: tl('Filter.HasNotes'),
    filter:
      ({ itemInfos, itemHashTags }) =>
      (item) =>
        Boolean(getNotes(item, itemInfos, itemHashTags)),
  },
];

export default itemInfosFilters;
