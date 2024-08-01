import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { LoadoutsByItem } from 'app/loadout/selectors';
import { FilterDefinition } from '../filter-types';
import { FiltersMap, SearchConfig } from '../search-config';

/**
 * A slice of data that could be used by loadout filter functions to
 * initialize some data required by particular filters. If a new filter needs
 * context that isn't here, add it to this interface and makeSearchFilterFactory
 * in search-filter.ts.
 */
export interface LoadoutFilterContext {
  /**
   * The selected store on the loadouts page
   */
  selectedLoadoutsStore: DimStore;
  loadoutsByItem: LoadoutsByItem;
  language: DimLanguage;
  allItems: DimItem[];
  d2Definitions: D2ManifestDefinitions | undefined;
}

/**
 * this provides data so that SearchConfig can build smarter lists of suggestions.
 * all properties must be optional, so jest & api stuff can use SearchConfig without any context
 */
export interface LoadoutSuggestionsContext {
  loadouts?: Loadout[];
  /**
   * The selected store on the loadouts page
   */
  selectedLoadoutsStore?: DimStore;
  allItems?: DimItem[];
  d2Definitions?: D2ManifestDefinitions;
}

export type LoadoutFilterDefinition = FilterDefinition<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>;

export type LoadoutFilterMap = FiltersMap<Loadout, LoadoutFilterContext, LoadoutSuggestionsContext>;

export type LoadoutSearchConfig = SearchConfig<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>;
