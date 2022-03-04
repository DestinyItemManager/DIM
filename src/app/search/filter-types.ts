import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { Settings } from 'app/settings/initial-settings';
import { WishListRoll } from 'app/wishlists/types';
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
  wishListsByHash: _.Dictionary<WishListRoll[]>;
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
 * The syntax this filter accepts.
 * * `simple`: `is:[keyword]` and `not:[keyword]`
 * * `query`: `[keyword]:[suggestion]`
 * * `freeform`: `[keyword]:[literallyanything]`
 * * `range`: `[keyword]:op?[number]`
 * * `rangeoverload`: `[keyword]:op?([number]|[suggestion])`
 * * `stat`:  `[keyword]:[suggestion]:op?[number]`
 */
export type FilterFormat =
  | 'simple'
  | 'query'
  | 'freeform'
  | 'range'
  | 'rangeoverload'
  | 'stat'
  | 'custom';

export function canonicalFilterFormats(format: FilterDefinition['format']): FilterFormat[] {
  if (!format) {
    return ['simple'];
  }
  return Array.isArray(format) ? format : [format];
}

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
   * Leave unset for `simple`, specify one, or specify multiple formats,
   * as long as their usage of `suggestions` doesn't clash.
   * `query`, `rangeoverload`, and `stat` use `suggestions`.
   */
  format?: FilterFormat | FilterFormat[];

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
   * A list of suggested keywords, depending on the format.
   */
  suggestions?: string[];

  /**
   * A custom function used to generate (additional) suggestions.
   * This should only be necessary for freeform or custom formats.
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
