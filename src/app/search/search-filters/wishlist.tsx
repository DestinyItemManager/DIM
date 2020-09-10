import { tl } from 'app/i18next-t';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { FilterDefinition } from '../filter-types';
import { makeDupeID } from '../search-filter';
import { checkIfIsDupe, computeDupes } from './dupes';

const checkIfIsWishlist = (
  item,
  inventoryWishListRolls: {
    [key: string]: InventoryWishListRoll;
  }
) => inventoryWishListRolls[item.id] && !inventoryWishListRolls[item.id].isUndesirable;

const wishlistFilters: FilterDefinition[] = [
  {
    keywords: 'wishlist',
    description: tl('Filter.Wishlist'),
    filterFunction: ({ inventoryWishListRolls }) => (item) =>
      checkIfIsWishlist(item, inventoryWishListRolls),
  },
  {
    keywords: 'wishlistdupe',
    description: tl('Filter.WishlistDupe'),
    filterFunction: ({ inventoryWishListRolls, stores }) => {
      const duplicates = computeDupes(stores);
      return (item) => {
        const dupeId = makeDupeID(item);
        if (!checkIfIsDupe(duplicates, dupeId, item)) {
          return false;
        }
        const itemDupes = duplicates?.[dupeId];
        return itemDupes?.some((d) => checkIfIsWishlist(d, inventoryWishListRolls));
      };
    },
  },
  {
    keywords: 'wishlistnotes',
    description: tl('Filter.WishlistNotes'),
    format: 'freeform',
    filterFunction: ({ inventoryWishListRolls, filterValue }) => (item) =>
      inventoryWishListRolls[item.id]?.notes?.toLocaleLowerCase().includes(filterValue),
  },
  {
    keywords: 'trashlist',
    description: tl('Filter.Trashlist'),
    filterFunction: ({ inventoryWishListRolls }) => (item) =>
      inventoryWishListRolls[item.id]?.isUndesirable,
  },
];

export default wishlistFilters;
