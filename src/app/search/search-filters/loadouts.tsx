import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { FilterDefinition } from '../filter-types';
import { quoteFilterString } from '../query-parser';

export function loadoutToSearchString(loadout: Loadout) {
  return 'inloadout:' + quoteFilterString(loadout.name.toLowerCase());
}

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    format: ['simple', 'freeform'],

    suggestionsGenerator: ({ loadouts }) => loadouts?.map(loadoutToSearchString),

    description: tl('Filter.InLoadout'),
    filter: ({ filterValue, loadoutsByItem }) => {
      // the default search:
      // is:inloadout
      if (filterValue === 'inloadout') {
        return (item) => Boolean(loadoutsByItem[item.id]);
      }

      // a search like
      // inloadout:"loadout name here"
      // inloadout:"pvp" (for all loadouts with pvp in their name)
      return (item) =>
        loadoutsByItem[item.id]?.some((l) => l.loadout.name.toLowerCase().includes(filterValue));
    },
  },
];

export default loadoutFilters;
