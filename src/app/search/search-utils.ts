import { parseQuery, QueryAST } from './query-parser';
import { SearchConfig } from './search-config';

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

      // "is:" filters are slightly special cased
      if (filterName === 'is') {
        return Boolean(searchConfig.isFilters[filterValue.toLowerCase()]);
      } else {
        // TODO: validate that filterValue is correct
        return Boolean(searchConfig.kvFilters[filterName]);
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
