import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { FilterDefinition } from '../filter-types';
import { isQuotable, quoteFilterString } from './freeform';

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    format: ['simple', 'freeform'],

    suggestionsGenerator: ({ loadouts }) =>
      loadouts
        ?.filter((l) => isQuotable(l.name))
        .map((l) => 'inloadout:' + quoteFilterString(l.name.toLowerCase())),

    description: tl('Filter.InLoadout'),
    filter: ({ keyword, filterValue, loadouts }) => {
      // the default search:
      // is:inloadout
      let selectedLoadouts = loadouts;

      // a search like
      // inloadout:"loadout name here"
      if (keyword !== 'is') {
        selectedLoadouts = loadouts.filter((l) => l.name.toLowerCase() === filterValue);
      }

      const loadoutItemIds = collectItemsInLoadouts(selectedLoadouts);
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
