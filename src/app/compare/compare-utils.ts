import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { quoteFilterString } from 'app/search/query-parser';

// A function so t() can be resolved at the time of use.
function getAdeptSuffixes() {
  return [t('Filter.Adept'), t('Filter.Timelost'), t('Filter.Harrowed')];
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
  return item.bucket.inWeapons
    ? `${[
        item.name,
        ...getAdeptSuffixes().map((suffix) => `${item.name} ${suffix.replaceAll('\\', '')}`),
      ]
        .map(matchString)
        .join(' or ')}`
    : `exactname:${quoteFilterString(item.name)}`;
}
