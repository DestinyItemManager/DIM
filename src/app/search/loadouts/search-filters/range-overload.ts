import { tl } from 'app/i18next-t';
import { getLoadoutSeason } from 'app/loadout-drawer/loadout-utils';
import { seasonTagToNumber } from 'app/search/items/search-filters/range-overload';
import { LoadoutFilterDefinition } from '../loadout-filter-types';

// overloadedRangeFilters: stuff that may test a range, but also accepts a word

const overloadedRangeFilters: LoadoutFilterDefinition[] = [
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
