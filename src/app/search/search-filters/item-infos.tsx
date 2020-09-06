import { tl } from 'app/i18next-t';
import { getNotes, getTag, itemTagSelectorList } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { FilterContext, FilterDefinition } from '../filter-types';

// simple checks against check an attribute found on DimItem
const itemInfosFilters: FilterDefinition[] = [
  {
    keywords: ['tagged'],
    description: [tl('Filter.Tags.Tagged')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { itemInfos, itemHashTags }: FilterContext) =>
      getTag(item, itemInfos, itemHashTags) !== undefined,
  },
  {
    keywords: ['tag'],
    description: [tl('Filter.Tags.Tag')],
    format: 'query',
    suggestionsGenerator: itemTagSelectorList.map((tag) => tag.type ?? 'none'),
    filterFunction: (
      item: DimItem,
      filterValue: string,
      { itemInfos, itemHashTags }: FilterContext
    ) => (getTag(item, itemInfos, itemHashTags) || 'none') === filterValue,
  },
  {
    keywords: ['hasnotes'],
    description: [tl('Filter.HasNotes')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { itemInfos, itemHashTags }: FilterContext) =>
      Boolean(getNotes(item, itemInfos, itemHashTags)),
  },
];

export default itemInfosFilters;
