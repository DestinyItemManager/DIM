import { flatMap } from '../util';
import * as _ from 'underscore';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ItemTransformer } from './d2-itemTransformer';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DtrItem } from './d2-dtr-class-defs';
import { DimStore } from '../inventory/store/d2-store-factory.service';

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

  _getAllItems(stores: DimStore[]) {
    // bugbug: this was holdover logic from D1 vendors, I think?
    // const firstItem = stores[0];

    // if (firstItem.allItems !== undefined) {
    //   return _.pluck(flatMap(stores, (store) => store.allItems), 'item');
    // }

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
  getWeaponList(stores: DimStore[], reviewDataCache: D2ReviewDataCache): DtrItem[] {
    const dtrItems = this._getDtrItems(stores, reviewDataCache);

    const list = new Set(dtrItems);

    return Array.from(list);
  }
}

export { D2ItemListBuilder };
