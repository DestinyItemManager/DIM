import angular from 'angular';
import _ from 'underscore';

import { LocalStorage } from './sync/local-storage';
import { IndexedDBStorage } from './sync/indexed-db-storage';
import { ChromeSyncStorage } from './sync/chrome-sync-storage';
import { GoogleDriveStorage } from './sync/google-drive-storage';

angular.module('dimApp')
  .factory('LocalStorage', LocalStorage)
  .factory('IndexedDBStorage', IndexedDBStorage)
  .factory('ChromeSyncStorage', ChromeSyncStorage)
  .factory('GoogleDriveStorage', GoogleDriveStorage)
  .factory('SyncService', SyncService);

function SyncService(
  $q,
  LocalStorage,
  IndexedDBStorage,
  ChromeSyncStorage,
  GoogleDriveStorage
) {
  var cached; // cached is the data in memory,

  const adapters = [
    LocalStorage,
    IndexedDBStorage,
    ChromeSyncStorage,
    GoogleDriveStorage
  ];

  // save data {key: value}
  function set(value, PUT) {
    if (!cached) {
      throw new Error("Must call get at least once before setting");
    }

    console.log(value, _.pick(cached, _.keys(value)));

    if (!PUT && angular.equals(_.pick(cached, _.keys(value)), value)) {
      console.log("Skip save, already got it");
      return $q.when();
    }

    // use replace to override the data. normally we're doing a PATCH
    if (PUT) { // update our data
      cached = value;
    } else {
      angular.extend(cached, value);
    }

    console.log('set', value);

    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        return promise.then(() => {
          console.log('setting', adapter.name, cached);
          return adapter.set(cached);
        });
        // TODO: catch?
      }
      return promise;
    }, $q.when());
  }

  let _getPromise = null;

  // get DIM saved data
  function get(force) {
    // if we already have it and we're not forcing a sync
    if (cached && !force) {
      return $q.resolve(cached);
    }

    if (_getPromise) {
      console.log("ALREADY LOADING DANGIT");
      return _getPromise;
    }
    // TODO: get from all adapters, setting along the way?
    // TODO: this prefers local data always, even if remote data has changed!
    // TODO: old code looked bottom-up

    let previous = null;
    _getPromise = adapters.reverse()
      .reduce((promise, adapter) => {
        if (adapter.enabled) {
          return promise.then((value) => {
            console.log('got', value, 'from previous', previous);
            if (value && !_.isEmpty(value)) {
              console.log('got from previous', previous, value);
              return value;
            }
            previous = adapter.name;
            console.log('getting', adapter.name);
            return adapter.get();
          });
          // TODO: catch, set status
        }
        return promise;
      }, $q.when())
      .then((value) => {
        console.log("caching value", value);
        cached = value || {};
        return value;
      })
      .finally(() => {
        _getPromise = null;
      });
    return _getPromise;
  }

  // remove something from DIM by key
  function remove(key) {
    // just delete that key, maybe someday save to an undo array?

    let deleted = false;
    if (_.isArray(key)) {
      _.each(key, (k) => {
        if (cached[k]) {
          delete cached[k];
          deleted = true;
        }
      });
    } else {
      deleted = Boolean(cached[key]);
      delete cached[key];
    }

    if (!deleted) {
      console.log("ALREADY DELETED", key);
      return $q.when();
    }

    // TODO: remove where possible, get/set elsewhere?
    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        if (adapter.remove) {
          return promise.then(() => adapter.remove(key));
        }
        return promise.then(() => adapter.set(cached));
        // TODO: catch?
      }
      return promise;
    }, $q.when());
  }

  function init() {
    return GoogleDriveStorage.init();
  }


  return {
    authorizeGdrive: function() {
      return GoogleDriveStorage.authorize();
      // TODO: then reload!
    },
    logoutGdrive: function() {
      return GoogleDriveStorage.revokeDrive();
    },
    get: get,
    set: set,
    remove: remove,
    init: init,
    adapters: adapters
  };
}
