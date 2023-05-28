import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { InGameLoadout, isInGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { FilterDefinition } from '../filter-types';
import { quoteFilterString } from '../query-parser';

export function loadoutToSearchString(loadout: Loadout | InGameLoadout) {
  return 'inloadout:' + quoteFilterString(loadout.name.toLowerCase());
}

// related: https://github.com/DestinyItemManager/DIM/issues/9069
// sanity check: `inloadout:#hashta` should not suggest `inloadout:inloadout:#hashtag` (double prefix)
function loadoutToSuggestions(loadout: Loadout) {
  return [
    quoteFilterString(loadout.name.toLowerCase()), // loadout name
    ...getHashtagsFromNote(loadout.name), // #hashtags in the name
    ...getHashtagsFromNote(loadout.notes), // #hashtags in the notes
  ].map((suggestion) => 'inloadout:' + suggestion);
}

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: 'inloadout',
    format: ['simple', 'freeform'],

    suggestionsGenerator: ({ loadouts }) => loadouts?.flatMap(loadoutToSuggestions),

    description: tl('Filter.InLoadout'),
    filter: ({ lhs, filterValue, loadoutsByItem }) => {
      // the default search:
      // is:inloadout
      if (lhs === 'is') {
        return (item) => Boolean(loadoutsByItem[item.id]);
      }

      // a search like
      // inloadout:"loadout name here"
      // inloadout:"pvp" (for all loadouts with pvp in their name)
      // inloadout:"#pve" (for all loadouts with the #pve hashtag in name or notes)
      return (item) =>
        loadoutsByItem[item.id]?.some(
          ({ loadout }) =>
            loadout.name.toLowerCase().includes(filterValue) ||
            (filterValue.startsWith('#') && // short circuit for less load
              !isInGameLoadout(loadout) &&
              getHashtagsFromNote(loadout.notes)
                .map((t) => t.toLowerCase())
                .includes(filterValue))
        );
    },
  },
];

export default loadoutFilters;
