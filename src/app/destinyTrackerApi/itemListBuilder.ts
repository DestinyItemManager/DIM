import _ from 'lodash';
import { D1Item } from '../inventory/item-types';
import { D1ItemFetchRequest } from '../item-review/d1-dtr-api-types';
import { translateToDtrWeapon } from './itemTransformer';
import { D1Store } from '../inventory/store-types';
import { Vendor } from '../vendors/vendor.service';
import store from '../store/store';
import { DtrRating } from '../item-review/dtr-api-types';

/**
 * Translate the universe of weapons that the user has in their stores into a collection of data that we can send the DTR API.
 * Tailored to work alongside the bulkFetcher.
 * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
 */
export function getWeaponList(
  stores: (D1Store | Vendor)[],
  ratings: {
    [key: string]: DtrRating;
  }
): D1ItemFetchRequest[] {
  const dtrWeapons = getDtrWeapons(stores, ratings);

  const list = new Set(dtrWeapons);

  return Array.from(list);
}

function getNewItems(allItems: D1Item[]): D1ItemFetchRequest[] {
  const allDtrItems = allItems.map(translateToDtrWeapon);
  const allKnownDtrItems = Object.values(store.getState().reviews.ratings);

  const unmatched = allDtrItems.filter(
    (dtrItem) =>
      !allKnownDtrItems.some(
        (i) => i.referenceId === parseInt(dtrItem.referenceId, 10) && i.roll === dtrItem.roll
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
  ratings: {
    [key: string]: DtrRating;
  }
): D1ItemFetchRequest[] {
  const allItems: D1Item[] = getAllItems(stores);

  const allWeapons = allItems.filter((item) => item.reviewable);

  const newGuns = getNewItems(allWeapons);

  if (Object.keys(ratings).length > 0) {
    return newGuns;
  }

  return allWeapons.map(translateToDtrWeapon);
}
