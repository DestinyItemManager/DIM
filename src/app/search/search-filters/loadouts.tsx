import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { FilterDefinition } from '../filter-types';

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    description: tl('Filter.InLoadout'),
    filterFunction: ({ loadouts }) => {
      const loadoutItemIds = collectItemsInLoadouts(loadouts);
      return (item) => loadoutItemIds.has(item.id);
    },
  },
];

export default loadoutFilters;

function collectItemsInLoadouts(loadouts: Loadout[]) {
  const loadoutItemIds: Set<string> = new Set();
  for (const loadout of loadouts) {
    for (const item of loadout.items) {
      if (item.id && item.id !== '0') {
        loadoutItemIds.add(item.id);
      }
    }
  }
  return loadoutItemIds;
}
