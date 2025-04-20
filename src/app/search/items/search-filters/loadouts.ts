import { tl } from 'app/i18next-t';
import { getHashtagsFromString } from 'app/inventory/note-hashtags';
import { InGameLoadout, isInGameLoadout, Loadout } from 'app/loadout/loadout-types';
import { quoteFilterString } from 'app/search/query-parser';
import { ItemFilterDefinition } from '../item-filter-types';

export function loadoutToSearchString(loadout: Loadout | InGameLoadout) {
  return `inloadout:${quoteFilterString(loadout.name.toLowerCase())}`;
}

// related: https://github.com/DestinyItemManager/DIM/issues/9069
// sanity check: `inloadout:#hashta` should not suggest `inloadout:inloadout:#hashtag` (double prefix)
function loadoutToSuggestions(loadout: Loadout) {
  return [
    quoteFilterString(loadout.name.toLowerCase()), // loadout name
    ...getHashtagsFromString(loadout.name, loadout.notes), // #hashtags in the name/notes
  ].map((suggestion) => `inloadout:${suggestion}`);
}

const loadoutFilters: ItemFilterDefinition[] = [
  {
    keywords: 'inloadout',
    format: ['simple', 'range', 'freeform'],
    suggestionsGenerator: ({ loadouts }) => loadouts?.flatMap(loadoutToSuggestions),
    description: tl('Filter.InLoadout'),
    filter: ({ lhs, filterValue, loadoutsByItem, compare }) => {
      // the range search for how many loadouts an item is in:
      // inloadout:>=3
      if (compare) {
        return (item) => compare(loadoutsByItem[item.id]?.length ?? 0);
      }

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
            loadout.id === filterValue ||
            loadout.name.toLowerCase().includes(filterValue) ||
            (filterValue.startsWith('#') && // short circuit for less load
              !isInGameLoadout(loadout) &&
              getHashtagsFromString(loadout.notes)
                .map((t) => t.toLowerCase())
                .includes(filterValue)),
        );
    },
  },
  {
    keywords: 'iningameloadout',
    format: 'simple',
    description: tl('Filter.InInGameLoadout'),
    filter:
      ({ loadoutsByItem }) =>
      (item) =>
        Boolean(loadoutsByItem[item.id]?.some((l) => isInGameLoadout(l.loadout))),
  },
  {
    keywords: 'indimloadout',
    format: 'simple',
    description: tl('Filter.InDimLoadout'),
    filter:
      ({ loadoutsByItem }) =>
      (item) =>
        Boolean(loadoutsByItem[item.id]?.some((l) => !isInGameLoadout(l.loadout))),
  },
];

export default loadoutFilters;
