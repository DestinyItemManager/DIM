import { flatMap } from '../util';
import _ from 'underscore';
import { ItemTransformer } from './itemTransformer';

/**
 * Translates collections of DIM items into a collection of data almost ready to ship to the DTR API.
 * Generally tailored to work with weapon data.
 *
 * @class ItemListBuilder
 */
class ItemListBuilder {
  constructor() {
    this._itemTransformer = new ItemTransformer();
  }

  _getNewItems(allItems, reviewDataCache) {
    var self = this;
    var allDtrItems = allItems.map(function(item) { return self._itemTransformer.translateToDtrWeapon(item); });
    var allKnownDtrItems = reviewDataCache.getItemStores();

    var unmatched = allDtrItems.filter(function(dtrItem) {
      var matchingItem = _.findWhere(allKnownDtrItems, { referenceId: String(dtrItem.referenceId), roll: dtrItem.roll });
      return (matchingItem === null);
    });

    return unmatched;
  }

  _getAllItems(stores) {
    return flatMap(stores, (store) => store.items);
  }

  // Get all of the weapons from our stores in a DTR API-friendly format.
  _getDtrWeapons(stores, reviewDataCache) {
    var self = this;
    var allItems = this._getAllItems(stores);

    var allWeapons = _.filter(allItems,
                        function(item) {
                          if (!item.primStat) {
                            return false;
                          }

                          return (item.bucket.sort === 'Weapons');
                        });

    var newGuns = this._getNewItems(allWeapons, reviewDataCache);

    if (reviewDataCache.getItemStores().length > 0) {
      return newGuns;
    }

    return _.map(allWeapons, function(item) { return self._itemTransformer.translateToDtrWeapon(item); });
  }

  /**
   * Translate the universe of weapons that the user has in their stores into a collection of data that we can send the DTR API.
   * Tailored to work alongside the bulkFetcher.
   * Non-obvious bit: it attempts to optimize away from sending items that already exist in the ReviewDataCache.
   *
   * @param {any} stores
   * @param {ReviewDataCache} reviewDataCache
   * @returns {array}
   *
   * @memberof ItemListBuilder
   */
  getWeaponList(stores, reviewDataCache) {
    var dtrWeapons = this._getDtrWeapons(stores, reviewDataCache);

    var list = [];
    var self = this;

    dtrWeapons.forEach(function(dtrWeapon) {
      if (!self._isKnownWeapon(list, dtrWeapon)) {
        list.push(dtrWeapon);
      }
    });

    return list;
  }

  _isKnownWeapon(list, dtrWeapon) {
    return _.contains(list, dtrWeapon);
  }
}

export { ItemListBuilder };