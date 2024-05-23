import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { LoadoutsByItem } from 'app/loadout-drawer/selectors';
import { FilterDefinition } from 'app/search/filter-types';

/**
 * A slice of data that could be used by loadout filter functions to
 * initialize some data required by particular filters. If a new filter needs
 * context that isn't here, add it to this interface and makeSearchFilterFactory
 * in search-filter.ts.
 */
export interface LoadoutFilterContext {
  loadoutsByItem: LoadoutsByItem;
  language: DimLanguage;
  d2Definitions: D2ManifestDefinitions | undefined;
}

/**
 * this provides data so that SearchConfig can build smarter lists of suggestions.
 * all properties must be optional, so jest & api stuff can use SearchConfig without any context
 */
export interface LoadoutSuggestionsContext {
  loadouts?: Loadout[];
  d2Definitions?: D2ManifestDefinitions;
}

export type LoadoutFilterDefinition = FilterDefinition<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>;
