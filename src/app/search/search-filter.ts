import { filterMap } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { stubTrue } from 'lodash';
import { FilterDefinition, ItemFilter, canonicalFilterFormats } from './filter-types';
import { QueryAST, parseQuery } from './query-parser';
import { SearchConfig } from './search-config';
import { rangeStringToComparator } from './search-utils';

/** Build a function that can take query text and return a filter function from it. */
export function makeSearchFilterFactory<I, FilterCtx, SuggestionsCtx>(
  { filtersMap: { isFilters, kvFilters } }: SearchConfig<I, FilterCtx, SuggestionsCtx>,
  filterContext: FilterCtx,
) {
  return (query: string): ItemFilter<I> => {
    query = query.trim().toLowerCase();
    if (!query.length) {
      // By default, show anything that doesn't have the archive tag
      return stubTrue;
    }

    const parsedQuery = parseQuery(query);

    // Transform our query syntax tree into a filter function by recursion.
    const transformAST = (ast: QueryAST): ItemFilter<I> | undefined => {
      switch (ast.op) {
        case 'and': {
          const fns = filterMap(ast.operands, transformAST);
          // Propagate filter errors
          return fns.length === ast.operands.length
            ? (item) => {
                for (const fn of fns) {
                  if (!fn(item)) {
                    return false;
                  }
                }
                return true;
              }
            : undefined;
        }
        case 'or': {
          const fns = filterMap(ast.operands, transformAST);
          // Propagate filter errors
          return fns.length === ast.operands.length
            ? (item) => {
                for (const fn of fns) {
                  if (fn(item)) {
                    return true;
                  }
                }
                return false;
              }
            : undefined;
        }
        case 'not': {
          const fn = transformAST(ast.operand);
          return fn && ((item) => !fn(item));
        }
        case 'filter': {
          const filterName = ast.type;
          const filterValue = ast.args;

          if (filterName === 'is') {
            // "is:" filters are slightly special cased
            const filterDef = isFilters[filterValue];
            if (filterDef) {
              try {
                return filterDef.filter({ lhs: filterName, filterValue, ...filterContext });
              } catch (e) {
                // An `is` filter really shouldn't throw an error on filter construction...
                errorLog(
                  'search',
                  'internal error: filter construction threw exception',
                  filterName,
                  filterValue,
                  e,
                );
              }
            }
            return undefined;
          } else {
            const filterDef = kvFilters[filterName];
            const matchedFilter =
              filterDef && matchFilter(filterDef, filterName, filterValue, filterContext);
            if (matchedFilter) {
              try {
                return matchedFilter(filterContext);
              } catch (e) {
                // If this happens, a filter declares more syntax valid than it actually accepts, which
                // is a bug in the filter declaration.
                errorLog(
                  'search',
                  'internal error: filter construction threw exception',
                  filterName,
                  filterValue,
                  e,
                );
              }
            }
            return undefined;
          }
        }
        case 'noop':
          return undefined;
      }
    };

    // If our filter has any invalid parts, the search filter should match no items
    return transformAST(parsedQuery) ?? (() => false);
  };
}

/** Matches a non-`is` filter syntax and returns a way to actually create the matched filter function. */
export function matchFilter<I, FilterCtx, SuggestionsCtx>(
  filterDef: FilterDefinition<I, FilterCtx, SuggestionsCtx>,
  lhs: string,
  filterValue: string,
  currentFilterContext?: FilterCtx,
): ((args: FilterCtx) => ItemFilter<I>) | undefined {
  for (const format of canonicalFilterFormats(filterDef.format)) {
    switch (format) {
      case 'simple': {
        break;
      }
      case 'query': {
        if (filterDef.suggestions!.includes(filterValue)) {
          return (filterContext) =>
            filterDef.filter({
              lhs,
              filterValue,
              ...filterContext,
            });
        } else {
          break;
        }
      }
      case 'freeform': {
        return (filterContext) => filterDef.filter({ lhs, filterValue, ...filterContext });
      }
      case 'range': {
        try {
          const compare = rangeStringToComparator(filterValue, filterDef.overload);
          return (filterContext) =>
            filterDef.filter({
              lhs,
              filterValue: '',
              compare,
              ...filterContext,
            });
        } catch {
          break;
        }
      }
      case 'stat': {
        const [stat, rangeString] = filterValue.split(':', 2);
        try {
          const compare = rangeStringToComparator(rangeString, filterDef.overload);
          const validator = filterDef.validateStat?.(currentFilterContext);
          if (!validator || validator(stat)) {
            return (filterContext) =>
              filterDef.filter({
                lhs,
                filterValue: stat,
                compare,
                ...filterContext,
              });
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      case 'custom':
        break;
    }
  }
}
