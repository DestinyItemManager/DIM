import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { InGameLoadout, isInGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { FilterDefinition } from '../filter-types';
import { quoteFilterString } from '../query-parser';

export function loadoutToSearchString(loadout: Loadout | InGameLoadout) {
  return 'inloadout:' + quoteFilterString(loadout.name.toLowerCase());
}

// XXX: revisit when issue #9069 has been fixed and check if suggestions still fail
//      see: https://github.com/DestinyItemManager/DIM/issues/9069
//      to check: `inloadout:#hashta` should not suggest `inloadout:inloadout:#hashtag` (double prefix)
//
// function loadoutToSuggestions(loadout: Loadout) {
//   return [
//     quoteFilterString(loadout.name.toLowerCase()),
//     ...getHashtagsFromNote(loadout.name),
//     ...getHashtagsFromNote(loadout.notes),
//   ].map(suggestion => 'inloadout:' + suggestion);
// }

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
              !isInGameLoadout(l.loadout) &&
              getHashtagsFromNote(l.loadout.notes).includes(filterValue))
        );
    },
  },
];

export default loadoutFilters;
