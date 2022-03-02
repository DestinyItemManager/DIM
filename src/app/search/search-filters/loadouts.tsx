import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
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
    filter: ({ filterValue, loadouts }) => {
      // the default search:
      // is:inloadout
      let selectedLoadouts = loadouts;

      // a search like
      // inloadout:"loadout name here"
      // inloadout:"pvp" (for all loadouts with pvp in their name)
      if (filterValue !== 'inloadout') {
        selectedLoadouts = loadouts.filter((l) => l.name.toLowerCase().includes(filterValue));
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
