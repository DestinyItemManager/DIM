import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { quoteFilterString } from 'app/search/query-parser';
import { matchText, plainString } from 'app/search/text-utils';
import { LoadoutFilterDefinition } from '../loadout-filter-types';

const freeformFilters: LoadoutFilterDefinition[] = [
  {
    keywords: ['name', 'exactname'],
    description: tl('LoadoutFilter.Name'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts }) =>
      loadouts?.map((loadout) => `exactname:${quoteFilterString(loadout.name.toLowerCase())}`),
    filter: ({ filterValue, language, lhs }) => {
      const test = matchText(filterValue, language, /* exact */ lhs === 'exactname');
      return (loadout) => test(loadout.name);
    },
  },
  {
    keywords: 'notes',
    description: tl('LoadoutFilter.Notes'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (loadout) =>
        Boolean(loadout.notes && plainString(loadout.notes, language).includes(filterValue));
    },
  },
  {
    keywords: 'keyword',
    description: tl('LoadoutFilter.PartialMatch'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts }) =>
      loadouts
        ? Array.from(
            new Set([
              ...loadouts.flatMap((loadout) => [
                ...getHashtagsFromNote(loadout.name),
                ...getHashtagsFromNote(loadout.notes),
              ]),
            ]),
          )
        : [],
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      const test = (s: string) => plainString(s, language).includes(filterValue);
      return (loadout) => test(loadout.name) || Boolean(loadout.notes && test(loadout.notes));
    },
  },
];

export default freeformFilters;
