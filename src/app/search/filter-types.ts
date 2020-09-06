import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { ReviewsState } from 'app/item-review/reducer';
import { Loadout } from 'app/loadout/loadout-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
type I18nInput = Parameters<typeof t>;

// a filter can return various bool-ish values
type ValidFilterOutput = boolean | null | undefined;

export type ItemFilter = (item: DimItem) => ValidFilterOutput;

type preprocessedValues = string | RegExp | number | ((a: number) => boolean);
type PreprocessorFilterPairs = PreprocessorFilterPair<preprocessedValues>;

/**
 * A slice of data that could be used by contextGenerator functions to
 * initialize some data required by particular filters. If a new filter needs
 * context that isn't here, add it to this interface and makeSearchFilterFactory
 * in search-filter.ts.
 */
export interface FilterContext {
  stores: DimStore[];
  currentStore: DimStore;
  loadouts: Loadout[];
  inventoryWishListRolls: { [key: string]: InventoryWishListRoll };
  ratings: ReviewsState['ratings'];
  newItems: Set<string>;
  itemInfos: ItemInfos;
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  };
}

// there are three valid combinations of filterValuePreprocessor and filterFunction:
type PreprocessorFilterPair<T extends preprocessedValues> =
  | {
      // filterValuePreprocessor doesn't exist
      filterValuePreprocessor?: undefined;
      // and filterFunction is provided filterValue and run once per item
      filterFunction: (
        item: DimItem,
        filterValue: string | undefined,
        context: FilterContext
      ) => ValidFilterOutput;
    }
  | {
      // filterValuePreprocessor returns type T once per *search*,
      filterValuePreprocessor: (filterValue: string) => T;
      // then type T is used (as arg 2) inside filterFunction once per item
      filterFunction: (item: DimItem, filterTester: T, context: FilterContext) => ValidFilterOutput;
    }
  | {
      // filterValuePreprocessor returns a function that accepts an item,
      filterValuePreprocessor: (filterValue: string, context: FilterContext) => ItemFilter;
      // and that function is used AS the filterFunction once per item
      filterFunction?: undefined;
    };

// the main event
export type FilterDefinition = PreprocessorFilterPairs & {
  /** one or more keywords which trigger the filter when typed into search bar */
  keywords: string[];

  /** optinally, a t()-compatible arg tuple pointing to a more brief filter description to show alongside filter suggestions */
  hint?: I18nInput;

  /** a t()-compatible arg tuple pointing to a full description of the filter, to show in filter help */
  description: string | I18nInput;

  /**
   * not sure if we want this. it would be used to generically make suggestions if suggestionsGenerator is missing.
   *
   * simple - an 'is/not' filter. the filter itself knows everything it's looking for
   *
   * query - a starting stem and a pre-known value, like "tag:keep". a filterValue will be involved and will match a string we expect
   *
   * freeform - a starting stem and a freeform value. the filterValue will be some arbitrary string we test against other strings
   *
   * range - a starting stem and a mathlike string afterward like <=5
   *
   * rangeoverload - a starting stem like "masterwork" and then either a mathlike string or a word
   */
  format: 'simple' | 'query' | 'freeform' | 'range' | 'rangeoverload';

  /** destinyVersion - 1 or 2, or if a filter applies to both, undefined */
  destinyVersion?: 1 | 2;

  /** a rich element to show in fancy search bar, instead of just letters */
  // TODO: do this later
  // breadcrumb?: (filterValue?: string) => JSX.Element;

  /** given the manifest, prep a set of suggestion based on, idk, perk names for instance? */
  // TODO: get back to the idea of generating suggestions based on manifest. that'll probably have to be a separate thing that's called on demand as we are autocompleting
  // TODO rename to suggestions
  suggestionsGenerator?: string[]; // | string[][] | ((defs: D2ManifestDefinitions) => string[]);

  /** is provided a list of all items. calculates some kind of global information before running the search */
  // TODO: move context into the filter functions themselves?
  //contextGenerator?: (context: FilterContext, filterValue?: string) => Context;
};

/*
this may be overkill. let's skip it for now in favor of saying filter functions should accept DimItem,
though in the near future we may want to be able to filter on different things such as Records, Mods, etc.

type DimItemVersion = DimItem | D1Item | D2Item;

type PreprocessorFilterPair<D extends DimItemVersion, T> =
  // filterValuePreprocessor doesn't exist
  // and filterFunction is provided filterValue and run once per item
  | {
      filterValuePreprocessor?: undefined;
      filterFunction: (item: D, filterValue?: string) => ValidFilterOutput;
    }
  // filterValuePreprocessor returns type T once per *search*,
  // then type T is used (as arg 2) inside filterFunction once per item
  | {
      filterValuePreprocessor: (filterValue: string) => T;
      filterFunction: (item: D, filterTester: T) => ValidFilterOutput;
    }
  // filterValuePreprocessor returns a function that accepts an item,
  // and that function is used AS the filterFunction once per item
  | {
      filterValuePreprocessor: (filterValue: string) => (item: D) => ValidFilterOutput;
      filterFunction?: undefined;
    };

// some acceptable types for filterValuePreprocessor to return
type PreprocessorFilterPairVersion<D extends DimItemVersion> =
  | PreprocessorFilterPair<D, string>
  | PreprocessorFilterPair<D, RegExp>
  | PreprocessorFilterPair<D, (a: number) => boolean>;


// this union !helps! ensure that
// destinyVersion and contextGenerator and filterValuePreprocessor and filterFunction
// have the same matching destiny types
type VersionUnion =
  // destinyVersion - 1 or 2, or if a filter applies to both, 0
  // contextGenerator - first calculates stats based on all owned items.
  //    i.e. which items have dupes, or what your highest total chest armor is
  | ({
      destinyVersion: 0;
      contextGenerator?: (allItems: DimItem[], filterValue?: string) => void;
    } & PreprocessorFilterPairVersion<DimItem>)
  | ({
      destinyVersion: 1;
      contextGenerator?: (allItems: D1Item[], filterValue?: string) => void;
    } & PreprocessorFilterPairVersion<D1Item>)
  | ({
      destinyVersion: 2;
      contextGenerator?: (allItems: D2Item[], filterValue?: string) => void;
    } & PreprocessorFilterPairVersion<D2Item>);
*/
