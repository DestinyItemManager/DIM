import idbKeyval from 'idb-keyval';

/**
 * This service helps us keep track of new items. They are persisted to indexedDB between sessions.
 * They are tracked whether or not the option to display them is on.
 */
export function NewItemsService(dimPlatformService, $q) {
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
    loadNewItems(dimPlatformService.getActive()).then((newItems) => {
      newItems.delete(item.id);
      service.hasNewItems = (newItems.size !== 0);
      saveNewItems(newItems);
    });
  }

  function clearNewItems(stores) {
    stores.forEach((store) => {
      store.items.forEach((item) => {
        if (item.isNew) {
          _removedNewItems.add(item.id);
          item.isNew = false;
        }
      });
    });
    service.hasNewItems = false;
    saveNewItems(new Set());
  }

  function loadNewItems(activePlatform) {
    if (activePlatform) {
      const key = newItemsKey();
      return idbKeyval.get(key).then((v) => v || new Set());
    }
    return $q.resolve(new Set());
  }

  function saveNewItems(newItems) {
    return idbKeyval.set(newItemsKey(), newItems);
  }

  function newItemsKey() {
    const platform = dimPlatformService.getActive();
    return `newItems-${platform ? platform.platformType : ''}`;
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