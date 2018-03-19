import { flatMap } from '../util';
import * as _ from 'underscore';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ItemTransformer } from './d2-itemTransformer';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DtrItem } from '../item-review/destiny-tracker.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';

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

  _getNewItems(allItems: DimItem[], reviewDataCache) {
    const allDtrItems = allItems.map((item) => this._itemTransformer.translateToDtrItem(item));
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = _.reject(allDtrItems, (dtrItem) => _.any(allKnownDtrItems, { referenceId: String(dtrItem.referenceId) }));

    return unmatched;
  }

  _getNewVendorItems(vendorItems: DtrItem[], reviewDataCache) {
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = _.reject(vendorItems, (vendorItem) => _.any(allKnownDtrItems, { referenceId: String(vendorItem.referenceId) }));

    return unmatched;
  }

  /**
   * In D1, extracting all of the items from all of the stores was a little different from
   * extracting all of the vendor items. If the interface is the same for both, this can go
   * away.
   */
  _getAllItems(stores: DimStore[]): DimItem[] {
    return flatMap(stores, (store) => store.items);
  }

  // Get all of the weapons from our stores in a DTR API-friendly format.
  _getDtrItems(stores: DimStore[], reviewDataCache: D2ReviewDataCache): DtrItem[] {
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
  getItemList(stores: DimStore[], reviewDataCache: D2ReviewDataCache): DtrItem[] {
    const dtrItems = this._getDtrItems(stores, reviewDataCache);

    const list = new Set(dtrItems);

    return Array.from(list);
  }

  getVendorItemList(vendorItems: DestinyVendorSaleItemComponent[], reviewDataCache: D2ReviewDataCache): DtrItem[] {
    const allVendorItems = vendorItems.map((vendorItem) => ({ referenceId: vendorItem.itemHash })) as DtrItem[];

    return this._getNewVendorItems(allVendorItems, reviewDataCache);
  }
}

export { D2ItemListBuilder };
