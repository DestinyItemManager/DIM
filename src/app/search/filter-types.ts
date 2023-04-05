import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { LoadoutsByItem } from 'app/loadout-drawer/selectors';
import { Settings } from 'app/settings/initial-settings';
import { WishListRoll } from 'app/wishlists/types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
type I18nInput = Parameters<typeof t>;

// a filter can return various bool-ish values
type ValidFilterOutput = boolean | null | undefined;

export type ItemFilter<I = DimItem> = (item: I) => ValidFilterOutput;

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
  wishListsByHash: _.Dictionary<WishListRoll[]>;
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
  d2Manifest?: D2ManifestDefinitions;
  allNotesHashtags?: string[];
  customStats?: CustomStatDef[];
}

// TODO: FilterCategory

/**
 * The syntax this filter accepts.
 * * `simple`: `is:[keyword]` and `not:[keyword]`
 * * `query`: `[keyword]:[suggestion]`
 * * `freeform`: `[keyword]:[literallyanything]`
 * * `range`: `[keyword]:op?([number]|[overload])`
 * * `stat`:  `[keyword]:[suggestion]:op?[number]`
 */
export type FilterFormat = 'simple' | 'query' | 'freeform' | 'range' | 'stat' | 'custom';

export function canonicalFilterFormats(format: FilterDefinition['format']): FilterFormat[] {
  if (!format) {
    return ['simple'];
  }
  return Array.isArray(format) ? format : [format];
}

/**
 * The arguments to the filter creation function coming from
 * parsing the filter syntax.
 */
export interface FilterArgs {
  /**
   * the matched left-hand-side. will be `is` when using is: or not: syntax,
   * otherwise the matched filter name
   */
  lhs: string;
  /**
   * the right-hand-side (or middle for stat filters).
   * if matching an is: filter, this is the keyword (rhs). otherwise,
   * this is the thing right next to the keyword
   */
  filterValue: string;
  /** the generated comparator if this is a range or stat filter */
  compare?: (value: number) => boolean;
}

/**
 * A definition of a filter or closely related group of filters. This is
 * self-contained and can be used for both autocomplete and for building up the
 * filter expression itself. We can also use it to drive filter help and filter
 * editor.
 */
export interface FilterDefinition<I extends DimItem = DimItem> {
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
   * `query` and `stat` use `suggestions`.
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
  filter: (args: FilterArgs & FilterContext) => ItemFilter<I>;

  /**
   * A list of suggested keywords, for `query` and `stat` formats.
   */
  suggestions?: string[];

  /**
   * For range-like filters, a mapping of strings to numbers (like season names or power cap aliases)
   */
  overload?: { [key: string]: number };

  /**
   * For stat filters, check whether this is a valid stat name or combination.
   */
  validateStat?: (filterContext?: FilterContext) => (stat: string) => boolean;

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
