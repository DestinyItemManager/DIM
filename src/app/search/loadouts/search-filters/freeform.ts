import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { matchText, plainString } from 'app/search/search-filters/freeform';
import { FilterDefinition } from '../../filter-types';
import { quoteFilterString } from '../../query-parser';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

const freeformFilters: FilterDefinition<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>[] = [
  {
    keywords: ['name', 'exactname'],
    description: tl('Filter.Name'),
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
    description: tl('Filter.Notes'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (loadout) =>
        Boolean(loadout.notes && plainString(loadout.notes, language).includes(filterValue));
    },
  },
  {
    keywords: 'keyword',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      const test = (s: string) => plainString(s, language).includes(filterValue);
      return (loadout) => test(loadout.name) || Boolean(loadout.notes && test(loadout.notes));
    },
  },
];

export default freeformFilters;
