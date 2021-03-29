import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { FilterDefinition } from '../filter-types';
import { isQuotable, quoteFilterString } from './freeform';

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',

    // excluding a "format" property causes autogeneration of the simple "is" and "not" stems
    suggestionsGenerator: ({ loadouts }) =>
      loadouts
        ?.filter((l) => isQuotable(l.name))
        .map((l) => quoteFilterString(l.name.toLowerCase())),

    description: tl('Filter.InLoadout'),
    filter: ({ filterValue, loadouts }) => {
      // the default search:
      // is:inloadout
      let selectedLoadouts = loadouts;

      // a search like
      // inloadout:"loadout name here"
      if (filterValue !== 'inloadout') {
        const foundLoadout = loadouts.find((l) => l.name === filterValue);
        selectedLoadouts = foundLoadout ? [foundLoadout] : [];
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
