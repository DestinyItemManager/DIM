import { flatMap } from '../util';
import * as _ from 'underscore';
import { ItemTransformer } from './itemTransformer';
import { ReviewDataCache } from './reviewDataCache';
import { D1ItemFetchRequest } from '../item-review/destiny-tracker.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';

/**
 * Translates collections of DIM items into a collection of data almost ready to ship to the DTR API.
 * Generally tailored to work with weapon data.
 */
export class ItemListBuilder {
  _itemTransformer = new ItemTransformer();

  _getNewItems(allItems: DimItem[], reviewDataCache: ReviewDataCache): D1ItemFetchRequest[] {
    const allDtrItems = allItems.map((item) => this._itemTransformer.translateToDtrWeapon(item));
    const allKnownDtrItems = reviewDataCache.getItemStores();

    const unmatched = _.reject(allDtrItems, (dtrItem) => _.any(allKnownDtrItems, { referenceId: dtrItem.referenceId.toString(), roll: dtrItem.roll }));

    return unmatched;
  }

  _getAllItems(stores: any[]) {
    const firstItem = stores[0];

    if (firstItem.allItems !== undefined) {
      return _.pluck(flatMap(stores, (vendor) => vendor.allItems), 'item');
    }

    return flatMap(stores, (store) => store.items);
  }

  // Get all of the weapons from our stores in a DTR API-friendly format.
  _getDtrWeapons(stores, reviewDataCache: ReviewDataCache): D1ItemFetchRequest[] {
    const allItems = this._getAllItems(stores);

    const allWeapons = allItems.filter((item) => item.primStat && item.bucket.sort === 'Weapons');

    const newGuns = this._getNewItems(allWeapons, reviewDataCache);

    if (reviewDataCache.getItemStores().length > 0) {
      return newGuns;
    }

    return allWeapons.map((weapon) => this._itemTransformer.translateToDtrWeapon(weapon));
  }

  /**
   * Translate the universe of weapons that the user has in their stores into a collection of data that we can send the DTR API.
   * Tailored to work alongside the bulkFetcher.
   * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
   */
  getWeaponList(stores, reviewDataCache: ReviewDataCache): D1ItemFetchRequest[] {
    const dtrWeapons = this._getDtrWeapons(stores, reviewDataCache);

    const list = new Set(dtrWeapons);

    return Array.from(list);
  }
}
