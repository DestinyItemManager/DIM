import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { FilterContext, FilterDefinition } from '../filter-types';
import { makeDupeID } from '../search-filter';
import { checkIfIsDupe, computeDupes } from './dupes';

const checkIfIsWishlist = (
  item: DimItem,
  inventoryWishListRolls: {
    [key: string]: InventoryWishListRoll;
  }
) => inventoryWishListRolls[item.id] && !inventoryWishListRolls[item.id].isUndesirable;

const wishlistFilters: FilterDefinition[] = [
  {
    keywords: ['wishlist'],
    description: [tl('Filter.Wishlist')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { inventoryWishListRolls }: FilterContext) =>
      checkIfIsWishlist(item, inventoryWishListRolls),
  },
  {
    keywords: ['wishlistdupe'],
    description: [tl('Filter.WishlistDupe')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { stores, inventoryWishListRolls }: FilterContext) => {
      const duplicates = computeDupes(stores);
      const dupeId = makeDupeID(item);
      if (!checkIfIsDupe(duplicates, dupeId, item)) {
        return false;
      }
      const itemDupes = duplicates?.[dupeId];
      return itemDupes?.some((d) => checkIfIsWishlist(d, inventoryWishListRolls));
    },
  },
  {
    keywords: ['wishlistnotes'],
    description: [tl('Filter.WishlistNotes')],
    format: 'freeform',
    filterFunction: (
      item: DimItem,
      filterValue: string,
      { inventoryWishListRolls }: FilterContext
    ) => inventoryWishListRolls[item.id]?.notes?.toLocaleLowerCase().includes(filterValue),
  },
  {
    keywords: ['trashlist'],
    description: [tl('Filter.Trashlist')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { inventoryWishListRolls }: FilterContext) =>
      inventoryWishListRolls[item.id]?.isUndesirable,
  },
];

export default wishlistFilters;
