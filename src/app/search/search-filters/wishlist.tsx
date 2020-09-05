import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { FilterDefinition } from '../filter-types';
import { makeDupeID } from '../search-filter';
import { checkIfIsDupe, initDupes, _duplicates } from './dupes';

const inventoryWishListRolls: { [key: string]: InventoryWishListRoll } = {};

export const checkIfIsWishlist = (item: DimItem) =>
  inventoryWishListRolls[item.id] && !inventoryWishListRolls[item.id].isUndesirable;

const wishlistFilters: FilterDefinition[] = [
  {
    keywords: ['wishlist'],
    description: [tl('Filter.Wishlist')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: checkIfIsWishlist,
  },
  {
    keywords: ['wishlistdupe'],
    description: [tl('Filter.WishlistDupe')],
    format: 'simple',
    destinyVersion: 0,
    contextGenerator: initDupes,
    filterFunction: (item: DimItem) => {
      if (!checkIfIsDupe(item)) {
        return false;
      }
      const dupeId = makeDupeID(item);
      const itemDupes = _duplicates?.[dupeId];
      return itemDupes?.some(checkIfIsWishlist);
    },
  },
  {
    keywords: ['wishlistnotes'],
    description: [tl('Filter.WishlistNotes')],
    format: 'freeform',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      inventoryWishListRolls[item.id]?.notes?.toLocaleLowerCase().includes(filterValue),
  },
  {
    keywords: ['trashlist'],
    description: [tl('Filter.Trashlist')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => inventoryWishListRolls[item.id]?.isUndesirable,
  },
];

export default wishlistFilters;
