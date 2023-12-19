import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { quoteFilterString } from 'app/search/query-parser';

/**
 * Strips the (Adept) (or (Timelost) or (Harrowed)) suffixes for the user's language
 * in order to include adept items in non-adept comparisons and vice versa.
 */
export const stripAdept = (name: string) =>
  name
    .replace(new RegExp(t('Filter.Adept'), 'gi'), '')
    .replace(new RegExp(t('Filter.Timelost'), 'gi'), '')
    .replace(new RegExp(t('Filter.Harrowed'), 'gi'), '')
    .trim();

/**
 * Builds search query that should be used to compare this item to its dupes,
 * correctly quoting/escaping the name.
 */
export function compareNameQuery(item: DimItem) {
  return item.bucket.inWeapons
    ? `name:${quoteFilterString(stripAdept(item.name))}`
    : `name:${quoteFilterString(item.name)}`;
}
