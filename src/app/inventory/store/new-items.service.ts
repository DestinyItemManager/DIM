import * as idbKeyval from 'idb-keyval';
import { getActivePlatform } from '../../accounts/platform.service';
import { DestinyAccount } from '../../accounts/destiny-account.service';
import { DimItem } from '../item-types';
import { DimStore } from '../store-types';
import { Subject } from 'rxjs/Subject';
import { $rootScope } from 'ngimport';
import store from '../../store/store';
import { setNewItems } from '../actions';

const _removedNewItems = new Set<string>();

// TODO: Make this a class and instantiate it per stores. Need the Profile objects to really sell it.

/**
 * This service helps us keep track of new items. They are persisted to indexedDB between sessions.
 * They are tracked whether or not the option to display them is on.
 */
export const NewItemsService = {
  _hasNewItems: false,
  get hasNewItems() {
    return this._hasNewItems;
  },
  set hasNewItems(hasNew) {
    if (hasNew !== this._hasNewItems) {
      this.$hasNewItems.next(hasNew);
    }
    this._hasNewItems = hasNew;
  },
  $hasNewItems: new Subject<boolean>(),

  /**
   * Should this item display as new? Note the check for previousItems size, so that
   * we don't mark everything as new on the first load.
   */
  isItemNew(id: string, previousItems: Set<string>, newItems: Set<string>) {
    let isNew = false;
    if (newItems.has(id)) {
      isNew = true;
    } else if (_removedNewItems.has(id)) {
      isNew = false;
    } else if (previousItems.size) {
      // Zero id check is to ignore general items and consumables
      isNew = id !== '0' && !previousItems.has(id);
      if (isNew) {
        newItems.add(id);
      }
    }
    return isNew;
  },

  dropNewItem(item: DimItem) {
    if (!item.isNew) {
      return;
    }
    _removedNewItems.add(item.id);
    item.isNew = false;
    const account = getActivePlatform();
    return this.loadNewItems(account).then((newItems) => {
      newItems.delete(item.id);
      this.hasNewItems = newItems.size !== 0;
      this.saveNewItems(newItems, account, item.destinyVersion);
    });
  },

  clearNewItems(stores: DimStore[], account: DestinyAccount) {
    if (!stores || !account) {
      return;
    }
    $rootScope.$apply(() => {
      stores.forEach((store) => {
        store.items.forEach((item) => {
          if (item.isNew) {
            _removedNewItems.add(item.id);
            item.isNew = false;
          }
        });
      });
      this.hasNewItems = false;
      this.saveNewItems(new Set(), account);
    });
  },

  loadNewItems(account: DestinyAccount): Promise<Set<string>> {
    if (account) {
      const key = newItemsKey(account);
      return Promise.resolve(idbKeyval.get(key)).then(
        (v) => (v as Set<string>) || new Set<string>()
      );
    }
    return Promise.resolve(new Set<string>());
  },

  saveNewItems(newItems: Set<string>, account: DestinyAccount) {
    store.dispatch(setNewItems(newItems));
    return Promise.resolve(idbKeyval.set(newItemsKey(account), newItems));
  },

  buildItemSet(stores) {
    const itemSet = new Set();
    stores.forEach((store) => {
      store.items.forEach((item) => {
        itemSet.add(item.id);
      });
    });
    return itemSet;
  },

  applyRemovedNewItems(newItems: Set<string>) {
    _removedNewItems.forEach((id) => newItems.delete(id));
    _removedNewItems.clear();
    this.hasNewItems = newItems.size !== 0;
  }
};

function newItemsKey(account: DestinyAccount) {
  return `newItems-m${account.membershipId}-p${account.platformType}-d${account.destinyVersion}`;
}
