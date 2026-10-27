import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { quoteFilterString } from 'app/search/query-parser';

// A function so t() can be resolved at the time of use.
function getAdeptSuffixes() {
  return [t('Filter.Adept'), t('Filter.Timelost'), t('Filter.Harrowed')];
}

/** Literal names for the current localized variant markers, independent of owned items. */
function getAdeptNames(name: string) {
  return getAdeptSuffixes().flatMap((pattern) => {
    // The current patterns escape parentheses; only Polish/Russian Timelost have alternatives.
    const marker = pattern.replaceAll('\\(', '(').replaceAll('\\)', ')');
    if (marker === '新・') {
      // Japanese Adept is a prefix.
      return [`${marker}${name}`];
    }
    const markers = marker.includes('(y|a)')
      ? ['y', 'a'].map((ending) => marker.replace('(y|a)', ending))
      : marker.includes('(ой|ая)')
        ? ['ой', 'ая'].map((ending) => marker.replace('(ой|ая)', ending))
        : [marker];
    // Suffixes may have a separating space or none (including Chinese names).
    return markers.flatMap((suffix) => [`${name} ${suffix}`, `${name}${suffix}`]);
  });
}

/**
 * Strips the (Adept) (or (Timelost) or (Harrowed)) suffixes for the user's language
 * in order to include adept items in non-adept comparisons and vice versa.
 */
export const stripAdept = (name: string) =>
  getAdeptSuffixes()
    .reduce((name, suffix) => name.replace(new RegExp(suffix, 'gi'), ''), name)
    .trim();

function matchString(name: string) {
  return `exactname:${quoteFilterString(name)}`;
}

/**
 * Builds search query that should be used to compare this item to its dupes,
 * correctly quoting/escaping the name.
 */
export function compareNameQuery(item: DimItem) {
  if (!item.bucket.inWeapons) {
    return matchString(item.name);
  }
  const name = stripAdept(item.name);
  return [...new Set([item.name, name, ...getAdeptNames(name)])].map(matchString).join(' or ');
}
