import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';
import { getTag, getNotes, ItemInfos, itemTagSelectorList } from 'app/inventory/dim-item-info';

const itemInfos: ItemInfos = {};

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition[] = [
  {
    keywords: ['tagged'],
    description: ['Filter.Tags.Tagged'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => getTag(item, itemInfos) !== undefined,
  },
  {
    keywords: ['tag'],
    description: ['Filter.Tags.Tag'],
    format: 'query',
    suggestionsGenerator: itemTagSelectorList.map((tag) => tag.type ?? 'none'),
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      (getTag(item, itemInfos) || 'none') === filterValue,
  },
  {
    keywords: ['hasnotes'],
    description: ['Filter.HasNotes'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => Boolean(getNotes(item, itemInfos)),
  },
];

export default simpleFilters;
