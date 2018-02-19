import * as idbKeyval from 'idb-keyval';
import { getActivePlatform } from '../../accounts/platform.service';
import { DimItem } from './d2-item-factory.service';
import { DestinyAccount } from '../../accounts/destiny-account.service';
import { DimStore } from './d2-store-factory.service';

const _removedNewItems = new Set<string>();

// TODO: Make this a class and instantiate it per stores. Need the Profile objects to really sell it.

/**
 * This service helps us keep track of new items. They are persisted to indexedDB between sessions.
 * They are tracked whether or not the option to display them is on.
 */
export const NewItemsService = {
  hasNewItems: false,

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
      isNew = (id !== '0' && !previousItems.has(id));
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
    this.loadNewItems(account).then((newItems) => {
      newItems.delete(item.id);
      this.hasNewItems = (newItems.size !== 0);
      this.saveNewItems(newItems, account, item.destinyVersion);
    });
  },

  clearNewItems(stores: DimStore[], account: DestinyAccount) {
    if (!stores || !account) {
      return;
    }
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
  },

  loadNewItems(account: DestinyAccount) {
    if (account) {
      const key = newItemsKey(account);
      return Promise.resolve(idbKeyval.get(key)).then((v) => v || new Set());
    }
    return Promise.resolve(new Set());
  },

  saveNewItems(newItems: Set<string>, account: DestinyAccount) {
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
    this.hasNewItems = (newItems.size !== 0);
  }
};

function newItemsKey(account: DestinyAccount) {
  return `newItems-m${account.membershipId}-p${account.platformType}-d${account.destinyVersion}`;
}
