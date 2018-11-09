import * as _ from 'lodash';
import { ReviewDataCache } from './reviewDataCache';
import { D1Item } from '../inventory/item-types';
import { D1ItemFetchRequest } from '../item-review/d1-dtr-api-types';
import { translateToDtrWeapon } from './itemTransformer';
import { D1Store } from '../inventory/store-types';
import { Vendor } from '../vendors/vendor.service';

/**
 * Translate the universe of weapons that the user has in their stores into a collection of data that we can send the DTR API.
 * Tailored to work alongside the bulkFetcher.
 * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
 */
export function getWeaponList(
  stores: (D1Store | Vendor)[],
  reviewDataCache: ReviewDataCache
): D1ItemFetchRequest[] {
  const dtrWeapons = getDtrWeapons(stores, reviewDataCache);

  const list = new Set(dtrWeapons);

  return Array.from(list);
}

function getNewItems(allItems: D1Item[], reviewDataCache: ReviewDataCache): D1ItemFetchRequest[] {
  const allDtrItems = allItems.map(translateToDtrWeapon);
  const allKnownDtrItems = reviewDataCache.getItemStores();

  const unmatched = allDtrItems.filter(
    (dtrItem) =>
      !allKnownDtrItems.some(
        (i) => i.referenceId === dtrItem.referenceId.toString() && i.roll === dtrItem.roll
      )
  );

  return unmatched;
}

function getAllItems(stores: (D1Store | Vendor)[]): D1Item[] {
  return _.flatMap(stores, (store) =>
    isVendor(store) ? store.allItems.map((i) => i.item) : store.items
  );
}

function isVendor(store: D1Store | Vendor): store is Vendor {
  return Boolean((store as Vendor).allItems);
}

// Get all of the weapons from our stores in a DTR API-friendly format.
function getDtrWeapons(
  stores: (D1Store | Vendor)[],
  reviewDataCache: ReviewDataCache
): D1ItemFetchRequest[] {
  const allItems: D1Item[] = getAllItems(stores);

  const allWeapons = allItems.filter((item) => item.reviewable);

  const newGuns = getNewItems(allWeapons, reviewDataCache);

  if (reviewDataCache.getItemStores().length > 0) {
    return newGuns;
  }

  return allWeapons.map(translateToDtrWeapon);
}
