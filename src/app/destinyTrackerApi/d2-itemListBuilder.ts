import * as _ from 'lodash';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition
} from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { D2Store } from '../inventory/store-types';
import { D2ItemFetchRequest } from '../item-review/d2-dtr-api-types';
import { translateToDtrItem, getD2Roll } from './d2-itemTransformer';
import { getItemStoreKey } from '../item-review/reducer';

/**
 * Translate the universe of items that the user has in their stores into a collection of data that we can send the DTR API.
 * Tailored to work alongside the bulkFetcher.
 * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
 */
export function getItemList(
  stores: D2Store[],
  reviewDataCache: D2ReviewDataCache
): D2ItemFetchRequest[] {
  const dtrItems = getDtrItems(stores, reviewDataCache);

  const list = new Set(dtrItems);

  return Array.from(list);
}

export function getVendorItemList(
  reviewDataCache: D2ReviewDataCache,
  vendorSaleItems?: DestinyVendorSaleItemComponent[],
  vendorItems?: DestinyVendorItemDefinition[]
): D2ItemFetchRequest[] {
  if (vendorSaleItems) {
    const allVendorItems = vendorSaleItems.map(
      (vendorItem): D2ItemFetchRequest => ({ referenceId: vendorItem.itemHash })
    );

    return getNewVendorItems(allVendorItems, reviewDataCache);
  } else if (vendorItems) {
    const allVendorItems = vendorItems.map((vi) => ({
      referenceId: vi.itemHash
    })) as D2ItemFetchRequest[];

    return getNewVendorItems(allVendorItems, reviewDataCache);
  } else {
    throw new Error('Neither sale items nor vendor items were supplied.');
  }
}

function getNewItems(allItems: D2Item[], reviewDataCache: D2ReviewDataCache) {
  const allDtrItems = allItems.map(translateToDtrItem);
  const allKnownDtrItems = new Set(
    reviewDataCache.getItemStores().map((kdi) => getItemStoreKey(kdi.referenceId, kdi.roll))
  );

  const unmatched = allDtrItems.filter(
    (di) => !allKnownDtrItems.has(getItemStoreKey(di.referenceId, getD2Roll(di.availablePerks)))
  );

  return unmatched;
}

function getNewVendorItems(vendorItems: D2ItemFetchRequest[], reviewDataCache: D2ReviewDataCache) {
  const allKnownDtrItems = new Set(
    reviewDataCache.getItemStores().map((kdi) => getItemStoreKey(kdi.referenceId, kdi.roll))
  );

  const unmatched = vendorItems.filter(
    (di) => !allKnownDtrItems.has(getItemStoreKey(di.referenceId, getD2Roll(di.availablePerks)))
  );

  return unmatched;
}

/**
 * In D1, extracting all of the items from all of the stores was a little different from
 * extracting all of the vendor items. If the interface is the same for both, this can go
 * away.
 */
function getAllReviewableItems(stores: D2Store[]): D2Item[] {
  return _.flatMap(stores, (store) => store.items.filter((item) => item.reviewable));
}

// Get all of the weapons from our stores in a DTR API-friendly format.
function getDtrItems(stores: D2Store[], reviewDataCache: D2ReviewDataCache): D2ItemFetchRequest[] {
  const allReviewableItems = getAllReviewableItems(stores);
  return getNewItems(allReviewableItems, reviewDataCache);
}
