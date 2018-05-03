import { flatMap } from '../util';
import * as _ from 'underscore';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ItemTransformer } from './d2-itemTransformer';
import { DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { D2Store } from '../inventory/store-types';
import { DtrItemFetchRequest } from '../item-review/d2-dtr-api-types';

/**
 * Translates collections of DIM items into a collection of data almost ready to ship to the DTR API.
 * Generally tailored to work with weapon data.
 * Also tailored for the D2 version.
 */
class D2ItemListBuilder {
  _itemTransformer: D2ItemTransformer;

  constructor() {
    this._itemTransformer = new D2ItemTransformer();
  }

  _getNewItems(allItems: D2Item[], reviewDataCache: D2ReviewDataCache) {
    const allDtrItems = allItems.map((item) => this._itemTransformer.translateToDtrItem(item));
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = allDtrItems.filter((di) => allKnownDtrItems.every((kdi) => di.referenceId !== kdi.referenceId));

    return unmatched;
  }

  _getNewVendorItems(vendorItems: DtrItemFetchRequest[], reviewDataCache: D2ReviewDataCache) {
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = vendorItems.filter((vi) => allKnownDtrItems.every((di) => di.referenceId !== vi.referenceId));

    return unmatched;
  }

  /**
   * In D1, extracting all of the items from all of the stores was a little different from
   * extracting all of the vendor items. If the interface is the same for both, this can go
   * away.
   */
  _getAllItems(stores: D2Store[]): D2Item[] {
    return flatMap(stores, (store) => store.items);
  }

  // Get all of the weapons from our stores in a DTR API-friendly format.
  _getDtrItems(stores: D2Store[], reviewDataCache: D2ReviewDataCache): DtrItemFetchRequest[] {
    const allItems = this._getAllItems(stores);

    const allReviewableItems = _.filter(allItems,
                        (item) => {
                          return (item.reviewable);
                        });

    const newItems = this._getNewItems(allReviewableItems, reviewDataCache);

    if (reviewDataCache.getItemStores().length > 0) {
      return newItems;
    }

    return allReviewableItems.map((item) => this._itemTransformer.translateToDtrItem(item));
  }

  /**
   * Translate the universe of items that the user has in their stores into a collection of data that we can send the DTR API.
   * Tailored to work alongside the bulkFetcher.
   * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
   */
  getItemList(stores: D2Store[], reviewDataCache: D2ReviewDataCache): DtrItemFetchRequest[] {
    const dtrItems = this._getDtrItems(stores, reviewDataCache);

    const list = new Set(dtrItems);

    return Array.from(list);
  }

  getVendorItemList(reviewDataCache: D2ReviewDataCache,
                    vendorSaleItems?: DestinyVendorSaleItemComponent[],
                    vendorItems?: DestinyVendorItemDefinition[]): DtrItemFetchRequest[] {
    if (vendorSaleItems) {
      const allVendorItems = vendorSaleItems.map((vendorItem): DtrItemFetchRequest => ({ referenceId: vendorItem.itemHash }));

      return this._getNewVendorItems(allVendorItems, reviewDataCache);
    } else if (vendorItems) {
      const allVendorItems = vendorItems.map((vi) => ({ referenceId: vi.itemHash })) as DtrItemFetchRequest[];

      return this._getNewVendorItems(allVendorItems, reviewDataCache);
    } else {
      throw new Error("Neither sale items nor vendor items were supplied.");
    }
  }
}

export { D2ItemListBuilder };
