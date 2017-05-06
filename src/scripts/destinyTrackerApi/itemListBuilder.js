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
    var allDtrItems = _.map(allItems, function(item) { return self._itemTransformer.translateToDtrWeapon(item); });
    var allKnownDtrItems = reviewDataCache.getItemStores();

    var unmatched = _.filter(allDtrItems, function(dtrItem) {
      var matchingItem = _.findWhere(allKnownDtrItems, { referenceId: String(dtrItem.referenceId), roll: dtrItem.roll });
      return (matchingItem === null);
    });

    return unmatched;
  }

  _getAllItems(stores) {
    var allItems = [];

    stores.forEach(function(store) {
      allItems = allItems.concat(store.items);
    });

    return allItems;
  }

  _getWeapons(stores, reviewDataCache) {
    var self = this;
    var allItems = this._getAllItems(stores);

    var allWeapons = _.filter(allItems,
                        function(item) {
                          if (!item.primStat) {
                            return false;
                          }

                          return (item.primStat.statHash === 368428387);
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
    var weapons = this._getWeapons(stores, reviewDataCache);

    var list = [];
    var self = this;

    weapons.forEach(function(weapon) {
      if (!self._isKnownWeapon(list, weapon)) {
        list.push(weapon);
      }
    });

    return list;
  }

  _isKnownWeapon(list, dtrWeapon) {
    return _.contains(list, dtrWeapon);
  }
}

export { ItemListBuilder };