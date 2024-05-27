import { tl } from 'app/i18next-t';
import { getLoadoutSeason } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { FilterDefinition } from 'app/search/filter-types';
import { seasonTagToNumber } from 'app/search/search-filters/range-overload';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

// overloadedRangeFilters: stuff that may test a range, but also accepts a word

const overloadedRangeFilters: FilterDefinition<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>[] = [
  {
    keywords: 'season',
    description: tl('LoadoutFilter.Season'),
    format: 'range',
    destinyVersion: 2,
    overload: Object.fromEntries(Object.entries(seasonTagToNumber).reverse()),
    filter: ({ d2Definitions, compare }) => {
      const seasons = d2Definitions
        ? Object.values(d2Definitions.Season.getAll())
            .sort((a, b) => b.seasonNumber - a.seasonNumber)
            .filter((s) => s.startDate)
        : [];
      return (loadout) => compare!(getLoadoutSeason(loadout, seasons)?.seasonNumber ?? -1);
    },
  },
];

export default overloadedRangeFilters;
