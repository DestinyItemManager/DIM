import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { LoadoutsByItem } from 'app/loadout/selectors';
import { FilterDefinition } from 'app/search/filter-types';
import { FiltersMap, SearchConfig } from 'app/search/search-config';
import { Settings } from 'app/settings/initial-settings';
import { WishListRoll } from 'app/wishlists/types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';

/**
 * A slice of data that could be used by filter functions to
 * initialize some data required by particular filters. If a new filter needs
 * context that isn't here, add it to this interface and makeSearchFilterFactory
 * in search-filter.ts.
 */
export interface FilterContext {
  stores: DimStore[];
  allItems: DimItem[];
  currentStore: DimStore;
  loadoutsByItem: LoadoutsByItem;
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined;
  wishListsByHash: Map<number, WishListRoll[]>;
  newItems: Set<string>;
  getTag: (item: DimItem) => TagValue | undefined;
  getNotes: (item: DimItem) => string | undefined;
  language: DimLanguage;
  customStats: Settings['customStats'];
  d2Definitions: D2ManifestDefinitions | undefined;
}

/**
 * this provides data so that SearchConfig can build smarter lists of suggestions.
 * all properties must be optional, so jest & api stuff can use SearchConfig without any context
 */
export interface SuggestionsContext {
  allItems?: DimItem[];
  loadouts?: Loadout[];
  getTag?: (item: DimItem) => TagValue | undefined;
  getNotes?: (item: DimItem) => string | undefined;
  d2Definitions?: D2ManifestDefinitions;
  allNotesHashtags?: string[];
  customStats?: CustomStatDef[];
}

export type ItemFilterDefinition = FilterDefinition<DimItem, FilterContext, SuggestionsContext>;

export type ItemFilterMap = FiltersMap<DimItem, FilterContext, SuggestionsContext>;

export type ItemSearchConfig = SearchConfig<DimItem, FilterContext, SuggestionsContext>;
