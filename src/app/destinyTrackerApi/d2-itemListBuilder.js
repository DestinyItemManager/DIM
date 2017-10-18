import { flatMap } from '../util';
import _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';

/**
 * Translates collections of DIM items into a collection of data almost ready to ship to the DTR API.
 * Generally tailored to work with weapon data.
 * Also tailored for the D2 version.
 *
 * @class D2ItemListBuilder
 */
class D2ItemListBuilder {
  constructor() {
    this._itemTransformer = new D2ItemTransformer();
  }

  _getNewItems(allItems, reviewDataCache) {
    const allDtrItems = allItems.map((item) => this._itemTransformer.translateToDtrItem(item));
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = _.reject(allDtrItems, (dtrItem) => _.any(allKnownDtrItems, { referenceId: String(dtrItem.referenceId), roll: dtrItem.roll }));

    return unmatched;
  }

  _getAllItems(stores) {
    const firstItem = stores[0];

    if (firstItem.allItems !== undefined) {
      return _.pluck(flatMap(stores, (vendor) => vendor.allItems), 'item');
    }

    return flatMap(stores, (store) => store.items);
  }

  // Get all of the weapons from our stores in a DTR API-friendly format.
  _getDtrItems(stores, reviewDataCache) {
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
   *
   * @param {any} stores
   * @param {ReviewDataCache} reviewDataCache
   * @returns {array<DtrItem>}
   *
   * @memberof D2ItemListBuilder
   */
  getWeaponList(stores, reviewDataCache) {
    const dtrItems = this._getDtrItems(stores, reviewDataCache);

    const list = new Set(dtrItems);

    return Array.from(list);
  }
}

export { D2ItemListBuilder };