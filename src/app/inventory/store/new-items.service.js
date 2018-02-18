import idbKeyval from 'idb-keyval';
import { getActivePlatform } from '../../accounts/platform.service';

/**
 * This service helps us keep track of new items. They are persisted to indexedDB between sessions.
 * They are tracked whether or not the option to display them is on.
 */
export function NewItemsService($q) {
  'ngInject';

  const _removedNewItems = new Set();

  const service = {
    isItemNew,
    dropNewItem,
    clearNewItems,
    loadNewItems,
    saveNewItems,
    buildItemSet,
    applyRemovedNewItems,
    hasNewItems: false
  };

  return service;

  // Should this item display as new? Note the check for previousItems size, so that
  // we don't mark everything as new on the first load.
  function isItemNew(id, previousItems, newItems) {
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
  }

  function applyRemovedNewItems(newItems) {
    _removedNewItems.forEach((id) => newItems.delete(id));
    _removedNewItems.clear();
    service.hasNewItems = (newItems.size !== 0);
  }

  function dropNewItem(item) {
    if (!item.isNew) {
      return;
    }
    _removedNewItems.add(item.id);
    item.isNew = false;
    const account = getActivePlatform();
    loadNewItems(account).then((newItems) => {
      newItems.delete(item.id);
      service.hasNewItems = (newItems.size !== 0);
      saveNewItems(newItems, account, item.destinyVersion);
    });
  }

  function clearNewItems(stores, account, destinyVersion) {
    stores.forEach((store) => {
      store.items.forEach((item) => {
        if (item.isNew) {
          _removedNewItems.add(item.id);
          item.isNew = false;
        }
      });
    });
    service.hasNewItems = false;
    saveNewItems(new Set(), account, destinyVersion);
  }

  function loadNewItems(account, destinyVersion) {
    if (account) {
      const key = newItemsKey(account, destinyVersion);
      return idbKeyval.get(key).then((v) => v || new Set());
    }
    return $q.resolve(new Set());
  }

  function saveNewItems(newItems, account, destinyVersion) {
    return idbKeyval.set(newItemsKey(account, destinyVersion), newItems);
  }

  function newItemsKey(account, destinyVersion) {
    return `newItems-m${account.membershipId}-p${account.platformType}-d${destinyVersion}`;
  }

  function buildItemSet(stores) {
    const itemSet = new Set();
    stores.forEach((store) => {
      store.items.forEach((item) => {
        itemSet.add(item.id);
      });
    });
    return itemSet;
  }
}
