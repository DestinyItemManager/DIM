import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { ItemInfos } from 'app/inventory-stores/dim-item-info';
import { DimItem } from 'app/inventory-stores/item-types';
import { DimStore } from 'app/inventory-stores/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { Settings } from 'app/settings/initial-settings';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
type I18nInput = Parameters<typeof t>;

// a filter can return various bool-ish values
type ValidFilterOutput = boolean | null | undefined;

export type ItemFilter = (item: DimItem) => ValidFilterOutput;

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
  loadouts: Loadout[];
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined;
  newItems: Set<string>;
  itemInfos: ItemInfos;
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  };
  language: string;
  customStats: Settings['customTotalStatsByClass'];
}

/**
 * this provides data so that SearchConfig can build smarter lists of suggestions.
 * all properties must be optional, so jest & api stuff can use SearchConfig without any context
 */
export interface SuggestionsContext {
  allItems?: DimItem[];
  loadouts?: Loadout[];
  itemInfos?: ItemInfos;
  d2Manifest?: D2ManifestDefinitions;
  allNotesHashtags?: string[];
}

// TODO: FilterCategory

/**
 * A definition of a filter or closely related group of filters. This is
 * self-contained and can be used for both autocomplete and for building up the
 * filter expression itself. We can also use it to drive filter help and filter
 * editor.
 */
export interface FilterDefinition {
  /**
   * One or more keywords which trigger the filter when typed into search bar.
   * What this means depends on what "format" this filter is.
   */
  keywords: string | string[];

  /**
   * A t()-compatible arg tuple or i18n key pointing to a full description of
   * the filter, to show in filter help
   */
  description: string | I18nInput;

  /**
   * What kind of query this is, used to help generate suggestions.
   *
   * `undefined` - a simple 'is/not' filter. the filter itself knows everything it's looking for
   *
   * `query` - a starting stem and a pre-known value, like "tag:keep". a filterValue will be involved and will match a string we expect
   *
   * `freeform` - a starting stem and a freeform value. the filterValue will be some arbitrary string we test against other strings
   *
   * `range` - a starting stem and a mathlike string afterward like <=5
   *
   * `rangeoverload` - a starting stem like "masterwork" and then either a mathlike string or a word
   *
   * `custom` - suppresses automated suggestion generation so suggestionsGenerator is the only source of suggestions
   */
  format?: 'query' | 'freeform' | 'range' | 'rangeoverload' | 'custom';

  /** destinyVersion - 1 or 2, or if a filter applies to both, undefined */
  destinyVersion?: 1 | 2;

  /** methods for retiring a filter */
  deprecated?: FilterDeprecation;

  /**
   * A function that is given context about the query and the world around it
   * (FilterContext) and should generate a simple filter function that is given
   * an item and returns whether that item should be included in the search.
   * Because this is a function that returns the item filter function, and it is
   * invoked once at the point where we parse the query, it can be used to
   * pre-process information that is needed by the actual filter function. that,
   * given a value from a more complex filter expression and the context about
   * the world around it, can generate a filter function. In that case, the
   * filter function will be generated once, at the point where the overall
   * query is parsed.
   */
  filter: (args: { filterValue: string } & FilterContext) => ItemFilter;

  /**
   * A list of suggested keywords for filters that can take a freeform filter value.
   */
  suggestions?: string[];

  /**
   * A custom function used to generate (additional) suggestions
   */
  suggestionsGenerator?: (args: SuggestionsContext) => string[] | undefined;

  /**
   * given an item, this generates a filter that should match that item
   */
  fromItem?: (item: DimItem) => string;
}

export const enum FilterDeprecation {
  NotDeprecated,
  Deprecated,
  Disabled,
}
