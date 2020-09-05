import { tl } from 'app/i18next-t';
import { getNotes, getTag, ItemInfos, itemTagSelectorList } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const itemInfos: ItemInfos = {};

// simple checks against check an attribute found on DimItem
const itemInfosFilters: FilterDefinition[] = [
  {
    keywords: ['tagged'],
    description: [tl('Filter.Tags.Tagged')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => getTag(item, itemInfos) !== undefined,
  },
  {
    keywords: ['tag'],
    description: [tl('Filter.Tags.Tag')],
    format: 'query',
    suggestionsGenerator: itemTagSelectorList.map((tag) => tag.type ?? 'none'),
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      (getTag(item, itemInfos) || 'none') === filterValue,
  },
  {
    keywords: ['hasnotes'],
    description: [tl('Filter.HasNotes')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => Boolean(getNotes(item, itemInfos)),
  },
];

export default itemInfosFilters;
