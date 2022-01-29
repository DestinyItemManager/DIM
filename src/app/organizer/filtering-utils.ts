import { DimItem } from 'app/inventory-stores/item-types';

export function itemIncludesCategories(item: DimItem, categoryHashes: number[]) {
  return categoryHashes.every((h) => h && item.itemCategoryHashes.includes(h));
}
