/* Utilities for text matching in filters. */

import { DIM_LANG_INFOS, DimLanguage } from 'app/i18n';

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = (language: DimLanguage) => DIM_LANG_INFOS[language].latinBased;

/** escape special characters for a regex */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove diacritics from latin-based string */
function latinize(s: string, language: DimLanguage) {
  return isLatinBased(language) ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '') : s;
}

/** Make a Regexp that searches starting at a word boundary */
export function startWordRegexp(s: string, language: DimLanguage) {
  return new RegExp(
    `${
      // Only some languages effectively use the \b regex word boundary
      isLatinBased(language) &&
      // Don't force a word boundary if the string doesn't start with a word
      /^\w/.test(s)
        ? '\\b'
        : ''
    }${escapeRegExp(s)}`,
    'i',
  );
}

/** returns input string toLower, and stripped of accents if it's a latin language */
export const plainString = (s: string, language: DimLanguage): string =>
  latinize(s, language).toLowerCase();

/**
 * Create a case-/diacritic-insensitive matching predicate for name / perkname filters.
 *
 * Requires an exact match if `exact`, otherwise partial.
 */
export function matchText(value: string, language: DimLanguage, exact: boolean) {
  const normalized = plainString(value, language);
  if (exact) {
    // Quotes must be normalized on the tested term `s`
    // because the `value` provided by the query parser has normalized quotes.
    return (s: string) => normalized === plainString(normalizeQuotes(s), language);
  } else {
    const startWord = startWordRegexp(normalized, language);
    return (s: string) => startWord.test(plainString(normalizeQuotes(s), language));
  }
}

/**
 * feed in an object with a `name` and a `description` property,
 * to get an array of just those strings
 */
export function testStringsFromDisplayProperties(
  test: (str: string) => boolean,
  displayProperties?: { name: string; description: string },
  includeDescription = true,
): boolean {
  if (!displayProperties) {
    return false;
  }

  return Boolean(
    (displayProperties.name && test(displayProperties.name)) ||
    (includeDescription && displayProperties.description && test(displayProperties.description)),
  );
}

/**
 * feed in an object or objects with a `name` and a `description` property
 */
export function testStringsFromDisplayPropertiesMap(
  test: (str: string) => boolean,
  displayProperties?:
    | { name: string; description: string }
    | { name: string; description: string }[]
    | null,
  includeDescription = true,
): boolean {
  if (!displayProperties) {
    return false;
  }
  if (!Array.isArray(displayProperties)) {
    return testStringsFromDisplayProperties(test, displayProperties, includeDescription);
  }
  return displayProperties.some((d) =>
    testStringsFromDisplayProperties(test, d, includeDescription),
  );
}

// http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
const singleQuoteLikeCharacters = /[\u2018-\u201A]/g;
const doubleQuoteLikeCharacters = /[\u201C-\u201E]/g;

// Turn quote variants into their boring ASCII equivalents for parsing.
export function normalizeQuotes(str: string) {
  return str.replace(singleQuoteLikeCharacters, "'").replace(doubleQuoteLikeCharacters, '"');
}

// These aren't global so they aren't stateful, and can be used to repeatedly .test()
export const unescapedSingleQuoteCharacters = /(?<!\\)[\u2018-\u201A']/;
export const unescapedDoubleQuoteCharacters = /(?<!\\)[\u201C-\u201E"]/;

export function escapeQuotes(str: string, onlyDouble = false) {
  if (!onlyDouble) {
    str = str.replace(new RegExp(unescapedSingleQuoteCharacters, 'g'), '\\$&');
  }
  str = str.replace(new RegExp(unescapedDoubleQuoteCharacters, 'g'), '\\$&');
  return str;
}
