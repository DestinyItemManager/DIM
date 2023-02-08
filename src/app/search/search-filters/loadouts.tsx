import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
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
      // inloadout:"#pve" (for all loadouts with the #pve hashtag in name or notes)
      return (item) =>
        loadoutsByItem[item.id]?.some(
          (l) =>
            l.loadout.name.toLowerCase().includes(filterValue) ||
            (filterValue.startsWith('#') && // short circuit for less load
              getHashtagsFromNote(l.loadout.notes).includes(filterValue))
        );
    },
  },
];

export default loadoutFilters;
