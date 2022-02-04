import { canonicalFilterFormats } from './filter-types';
import { parseQuery, QueryAST } from './query-parser';
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

export function parseAndValidateQuery(query: string, searchConfig: SearchConfig) {
  let valid = true;
  try {
    const ast = parseQuery(query);
    if (!validateQuery(ast, searchConfig)) {
      valid = false;
    }
  } catch (e) {
    valid = false;
  }
  return valid;
}

/**
 * Return whether the query is completely valid - syntactically, and where every term matches a known filter.
 */
export function validateQuery(query: QueryAST, searchConfig: SearchConfig): boolean {
  if (query.error) {
    return false;
  }
  switch (query.op) {
    case 'filter': {
      const filterName = query.type;
      const filterValue = query.args;

      if (filterName === 'is') {
        const filterDef = searchConfig.filters[filterValue];
        return filterDef && canonicalFilterFormats(filterDef.format).some((f) => f === 'simple');
      } else {
        const filterDef = searchConfig.filters[filterName];
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
