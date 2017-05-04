import _ from 'underscore';
import { itemTransformer } from './itemTransformer.js';

class itemListBuilder {
  constructor() {
    this._itemTransformer = new itemTransformer();
  }

  getNewItems(allItems, scoreMaintainer) {
    var self = this;
    var allDtrItems = _.map(allItems, function(item) { return self._itemTransformer.translateToDtrWeapon(item); });
    var allKnownDtrItems = scoreMaintainer.getItemStores();

    var unmatched = _.filter(allDtrItems, function(dtrItem) {
      var matchingItem = _.findWhere(allKnownDtrItems, { referenceId: String(dtrItem.referenceId), roll: dtrItem.roll });
      return (matchingItem === null);
    });

    return unmatched;
  }

  getAllItems(stores) {
    var allItems = [];

    stores.forEach(function(store) {
      allItems = allItems.concat(store.items);
    });

    return allItems;
  }

  getGuns(stores, scoreMaintainer) {
    var self = this;
    var allItems = this.getAllItems(stores);

    var allGuns = _.filter(allItems,
                        function(item) {
                          if (!item.primStat) {
                            return false;
                          }

                          return (item.primStat.statHash === 368428387);
                        });

    var newGuns = this.getNewItems(allGuns, scoreMaintainer);

    if (scoreMaintainer.getItemStores().length > 0) {
      return newGuns;
    }

    return _.map(allGuns, function(item) { return self._itemTransformer.translateToDtrWeapon(item); });
  }

  getWeaponList(stores, scoreMaintainer) {
    var guns = this.getGuns(stores, scoreMaintainer);

    var list = [];
    var self = this;

    guns.forEach(function(gun) {
      if (!self.isKnownGun(list, gun)) {
        list.push(gun);
      }
    });

    return list;
  }

  isKnownGun(list, dtrGun) {
    return _.contains(list, dtrGun);
  }
}

export { itemListBuilder };