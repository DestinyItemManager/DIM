// Helpers for effectively using the browser's Intl.* tools
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl

import { DimLanguage, browserLangToDimLang } from 'app/i18n';
import memoizeOne from 'memoize-one';
import { invert } from './collections';
import { Comparator } from './comparators';
import { stubTrue } from './functions';

// Our locale names don't line up with the BCP 47 tags for Chinese
const dimLangToBrowserLang = invert(browserLangToDimLang);

/** Map DIM's locale values to a [BCP 47 language tag](http://tools.ietf.org/html/rfc5646) */
function mapLocale(language: DimLanguage): Intl.UnicodeBCP47LocaleIdentifier {
  return dimLangToBrowserLang[language] ?? language;
}

const cachedSortCollator = memoizeOne(
  (language: DimLanguage) =>
    new Intl.Collator(mapLocale(language), {
      // Consider "9" to come before "10"
      numeric: true,
      usage: 'sort',
      sensitivity: 'accent',
    }),
);

const cachedSearchCollator = memoizeOne(
  (language: DimLanguage) =>
    new Intl.Collator(mapLocale(language), { usage: 'search', sensitivity: 'base' }),
);

const cachedListFormatter = memoizeOne(
  (language: DimLanguage) => new Intl.ListFormat(mapLocale(language)),
);

export function localizedListFormatter(language: DimLanguage) {
  return cachedListFormatter(language);
}

/**
 * Return a sorting function that can sort arrays of type `T[]` in a locale-aware
 * way using some projection function on `T`.
 *
 * @example
 * ["foo10", "foo9"].sort(localizedSorter("en")) // ["foo9", "foo10"]
 */
export function localizedSorter<T>(
  language: DimLanguage,
  iteratee: (input: T) => string,
): Comparator<T> {
  const sortCollator = cachedSortCollator(language);
  return (a: T, b: T) => sortCollator.compare(iteratee(a), iteratee(b)) as 0 | 1 | -1;
}

/**
 * Return a version of `String.prototype.includes` that does locale-aware comparison. The query string is baked in.
 *
 * @example
 * const includes = localizedIncludes('en', 'föo');
 * ["foobar", "barföo"].every((s) => includes(s)) // true
 */
export function localizedIncludes(language: DimLanguage, query: string) {
  if (query.length === 0) {
    return stubTrue;
  }
  const filterCollator = cachedSearchCollator(language);

  // Normalize the strings so we can compare the same abstract characters regardless of their original representation
  const normalizedQuery = query.normalize('NFC');

  // Unfortunately Collator does not have a substring search method so we have to walk the string sequentially
  // See https://github.com/adobe/react-spectrum/blob/7f63e933e61f20891b4cf3f447ab817f918cb263/packages/%40react-aria/i18n/src/useFilter.ts#L58-L76
  return (string: string) => {
    if (normalizedQuery.length === 0) {
      return true;
    }

    string = string.normalize('NFC');

    let scan = 0;
    const sliceLen = normalizedQuery.length;
    for (; scan + sliceLen <= string.length; scan++) {
      const slice = string.slice(scan, scan + sliceLen);
      if (filterCollator.compare(normalizedQuery, slice) === 0) {
        return true;
      }
    }

    return false;
  };
}
