import { I18nKey, t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
type I18nInput = Parameters<typeof t>;

// a filter can return various bool-ish values
type ValidFilterOutput = boolean | null | undefined;

export type ItemFilter<I = DimItem> = (item: I) => ValidFilterOutput;

/**
 * The syntax this filter accepts.
 * * `simple`: `is:[keyword]` and `not:[keyword]`
 * * `query`: `[keyword]:[suggestion]`
 * * `freeform`: `[keyword]:[literallyanything]`
 * * `range`: `[keyword]:op?([number]|[overload])`
 * * `stat`:  `[keyword]:[suggestion]:op?[number]`
 */
export type FilterFormat = 'simple' | 'query' | 'freeform' | 'range' | 'stat' | 'custom';

export function canonicalFilterFormats<I, FilterCtx, SuggestionsCtx>(
  format: FilterDefinition<I, FilterCtx, SuggestionsCtx>['format'],
): FilterFormat[] {
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
export interface FilterDefinition<I, FilterCtx, SuggestionsCtx> {
  /**
   * One or more keywords which trigger the filter when typed into search bar.
   * What this means depends on what "format" this filter is.
   */
  keywords: string | string[];

  /**
   * A t()-compatible arg tuple or i18n key pointing to a full description of
   * the filter, to show in filter help
   */
  description: I18nKey | I18nInput;

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
  deprecated?: boolean;

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
  filter: (args: FilterArgs & FilterCtx) => ItemFilter<I>;

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
  validateStat?: (filterContext?: FilterCtx) => (stat: string) => boolean;

  /**
   * A custom function used to generate (additional) suggestions.
   * This should only be necessary for freeform or custom formats.
   */
  suggestionsGenerator?: (
    args: SuggestionsCtx,
  ) => string[] | { keyword: string; ops?: string[] }[] | undefined;

  /**
   * given an item, this generates a filter that should match that item
   */
  fromItem?: (item: I) => string;
}
