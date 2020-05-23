import _ from 'lodash';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition,
} from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { D2Store } from '../inventory/store-types';
import { D2ItemFetchRequest } from '../item-review/d2-dtr-api-types';
import { translateToDtrItem, getD2Roll } from './d2-itemTransformer';
import { getItemStoreKey } from '../item-review/reducer';
import { DtrRating } from '../item-review/dtr-api-types';

// How long to consider an item rating "fresh" - 24 hours
export const ITEM_RATING_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Translate the universe of items that the user has in their stores into a collection of data that we can send the DTR API.
 * Tailored to work alongside the bulkFetcher.
 * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
 */
export function getItemList(
  stores: D2Store[],
  ratings: {
    [key: string]: DtrRating;
  }
): D2ItemFetchRequest[] {
  const dtrItems = getDtrItems(stores, ratings);

  const list = new Set(dtrItems);

  return Array.from(list);
}

export function getVendorItemList(
  ratings: {
    [key: string]: DtrRating;
  },
  vendorSaleItems?: DestinyVendorSaleItemComponent[],
  vendorItems?: DestinyVendorItemDefinition[]
): D2ItemFetchRequest[] {
  if (vendorSaleItems) {
    const allVendorItems = vendorSaleItems.map(
      (vendorItem): D2ItemFetchRequest => ({ referenceId: vendorItem.itemHash })
    );

    return getNewItemsFromFetchRequests(allVendorItems, ratings);
  } else if (vendorItems) {
    const allVendorItems = vendorItems.map((vi) => ({
      referenceId: vi.itemHash,
    })) as D2ItemFetchRequest[];

    return getNewItemsFromFetchRequests(allVendorItems, ratings);
  } else {
    throw new Error('Neither sale items nor vendor items were supplied.');
  }
}

function getNewItems(
  allItems: D2Item[],
  ratings: {
    [key: string]: DtrRating;
  }
) {
  const allDtrItems = allItems.map(translateToDtrItem);
  return getNewItemsFromFetchRequests(allDtrItems, ratings);
}

function getNewItemsFromFetchRequests(
  items: D2ItemFetchRequest[],
  ratings: {
    [key: string]: DtrRating;
  }
) {
  const cutoff = new Date(Date.now() - ITEM_RATING_EXPIRATION);
  const unmatched = items.filter((di) => {
    const existingRating = ratings[getItemStoreKey(di.referenceId, getD2Roll(di.availablePerks))];
    return !existingRating || existingRating.lastUpdated < cutoff;
  });

  return unmatched;
}

/**
 * In D1, extracting all of the items from all of the stores was a little different from
 * extracting all of the vendor items. If the interface is the same for both, this can go
 * away.
 */
function getAllReviewableItems(stores: D2Store[]): D2Item[] {
  return stores.flatMap((store) => store.items.filter((item) => item.reviewable));
}

// Get all of the weapons from our stores in a DTR API-friendly format.
function getDtrItems(
  stores: D2Store[],
  ratings: {
    [key: string]: DtrRating;
  }
): D2ItemFetchRequest[] {
  const allReviewableItems = getAllReviewableItems(stores);
  return getNewItems(allReviewableItems, ratings);
}
