import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { FilterDefinition } from '../filter-types';

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    // format: 'custom',
    suggestionsGenerator: ({ loadouts }) =>
      loadouts
        ?.filter((l) => !(l.name.includes(`'`) && l.name.includes(`"`)))
        .map((l) => (l.name.includes(`"`) ? `inloadout:'${l.name}'` : `inloadout:"${l.name}"`)) ??
      [],
    description: tl('Filter.InLoadout'),
    filter: ({ filterValue, loadouts }) => {
      // is:inloadout
      let selectedLoadouts = loadouts;

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
