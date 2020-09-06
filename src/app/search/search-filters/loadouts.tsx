import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout/loadout-types';
import memoizeOne from 'memoize-one';
import { FilterContext, FilterDefinition } from '../filter-types';

const collectItemsInLoadouts = memoizeOne((loadouts: Loadout[]) => {
  const loadoutItemIds: Set<string> = new Set();
  for (const loadout of loadouts) {
    for (const item of loadout.items) {
      if (item.id && item.id !== '0') {
        loadoutItemIds.add(item.id);
      }
    }
  }
  return loadoutItemIds;
});

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    description: tl('Filter.InLoadout'),
    filterFunction: (item: DimItem, _, { loadouts }: FilterContext) =>
      collectItemsInLoadouts(loadouts).has(item.id),
  },
];

export default loadoutFilters;
