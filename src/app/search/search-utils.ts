import { canonicalizeQuery, parseQuery, QueryAST } from './query-parser';
import { SearchConfig } from './search-config';
import { matchFilter } from './search-filter';

const rangeStringRegex = /^([<=>]{0,2})(\d+(?:\.\d+)?)$/;
const overloadedRangeStringRegex = /^([<=>]{0,2})(\w+)$/;

export function rangeStringToComparator(
  rangeString?: string,
  overloads?: { [key: string]: number }
) {
  if (!rangeString) {
    throw new Error('Missing range comparison');
  }

  const [operator, comparisonValue] = extractOpAndValue(rangeString, overloads);

  switch (operator) {
    case '=':
    case '':
      return (compare: number) => compare === comparisonValue;
    case '<':
      return (compare: number) => compare < comparisonValue;
    case '<=':
      return (compare: number) => compare <= comparisonValue;
    case '>':
      return (compare: number) => compare > comparisonValue;
    case '>=':
      return (compare: number) => compare >= comparisonValue;
  }
  throw new Error('Unknown range operator ' + operator);
}

function extractOpAndValue(rangeString: string, overloads?: { [key: string]: number }) {
  const matchedOverloadString = rangeString.match(overloadedRangeStringRegex);
  if (matchedOverloadString && overloads && matchedOverloadString[2] in overloads) {
    return [matchedOverloadString[1], overloads[matchedOverloadString[2]]] as const;
  }

  const matchedRangeString = rangeString.match(rangeStringRegex);
  if (matchedRangeString) {
    return [matchedRangeString[1], parseFloat(matchedRangeString[2])] as const;
  }

  throw new Error("Doesn't match our range comparison syntax, or invalid overload");
}

export function parseAndValidateQuery(
  query: string,
  searchConfig: SearchConfig
): {
  /** Is the query valid at all? */
  valid: boolean;
  /** Can the user save this query? */
  saveable: boolean;
  /** Should we automatically save this in search history? */
  saveInHistory: boolean;
  /** The canonicalized version of the query */
  canonical: string;
} {
  let valid = true;
  let saveable = true;
  let saveInHistory = true;
  let canonical = query;
  try {
    const ast = parseQuery(query);
    if (!validateQuery(ast, searchConfig)) {
      valid = false;
    } else {
      if (ast.op === 'noop' || (ast.op === 'filter' && ast.type === 'keyword')) {
        // don't save "trivial" single-keyword filters
        saveInHistory = false;
      }
      // Some sites have people save big lists of item IDs. Even if these aren't too long, don't save them automatically
      if (ast.op === 'or' && ast.operands.every((op) => op.op === 'filter' && op.type === 'id')) {
        saveInHistory = false;
      }
      canonical = canonicalizeQuery(ast);
      saveable = canonical.length <= 2048;
    }
  } catch (e) {
    valid = false;
  }
  return {
    valid,
    saveable: valid && saveable,
    saveInHistory: valid && saveable && saveInHistory,
    canonical,
  };
}

/**
 * Return whether the query is completely valid - syntactically, and where every term matches a known filter
 * and every filter RHS matches the declared format and options for the filter syntax.
 */
function validateQuery(query: QueryAST, searchConfig: SearchConfig): boolean {
  if (query.error) {
    return false;
  }
  switch (query.op) {
    case 'filter': {
      const filterName = query.type;
      const filterValue = query.args;

      // "is:" filters are slightly special cased
      if (filterName === 'is') {
        return Boolean(searchConfig.isFilters[filterValue]);
      } else {
        const filterDef = searchConfig.kvFilters[filterName];
        return Boolean(filterDef && matchFilter(filterDef, filterName, filterValue));
      }
    }
    case 'not':
      return validateQuery(query.operand, searchConfig);
    case 'and':
    case 'or': {
      return query.operands.every((q) => validateQuery(q, searchConfig));
    }
    case 'noop':
      return true;
  }
}
