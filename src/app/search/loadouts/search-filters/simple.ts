import { tl } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { isArmorModsOnly, isFashionOnly } from 'app/loadout-drawer/loadout-utils';
import { FilterDefinition } from 'app/search/filter-types';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition<Loadout, LoadoutFilterContext, LoadoutSuggestionsContext>[] =
  [
    {
      keywords: 'fashiononly',
      description: tl('LoadoutFilter.FashionOnly'),
      destinyVersion: 2,
      filter:
        ({ d2Definitions }) =>
        (loadout) =>
          isFashionOnly(d2Definitions!, loadout),
    },
    {
      keywords: 'modsonly',
      description: tl('LoadoutFilter.ModsOnly'),
      destinyVersion: 2,
      filter:
        ({ d2Definitions }) =>
        (loadout) =>
          isArmorModsOnly(d2Definitions!, loadout),
    },
  ];

export default simpleFilters;
