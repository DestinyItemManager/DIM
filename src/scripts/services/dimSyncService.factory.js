import angular from 'angular';
import _ from 'underscore';

import { IndexedDBStorage } from './sync/indexed-db-storage';
import { ChromeSyncStorage } from './sync/chrome-sync-storage';
import { GoogleDriveStorage } from './sync/google-drive-storage';

angular.module('dimApp')
  .factory('IndexedDBStorage', IndexedDBStorage)
  .factory('ChromeSyncStorage', ChromeSyncStorage)
  .factory('GoogleDriveStorage', GoogleDriveStorage)
  .factory('SyncService', SyncService);

function SyncService(
  $q,
  IndexedDBStorage,
  ChromeSyncStorage,
  GoogleDriveStorage
) {
  var cached; // cached is the data in memory,

  const adapters = [
    IndexedDBStorage,
    ChromeSyncStorage,
    GoogleDriveStorage
  ].filter((a) => a.supported);

  // save data {key: value}
  function set(value, PUT) {
    if (!cached) {
      throw new Error("Must call get at least once before setting");
    }

    if (!PUT && angular.equals(_.pick(cached, _.keys(value)), value)) {
      if ($featureFlags.debugSync) {
        console.log("Skip save, already got it");
      }
      return $q.when();
    }

    // use replace to override the data. normally we're doing a PATCH
    if (PUT) { // update our data
      cached = value;
    } else {
      angular.extend(cached, value);
    }

    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        return promise.then(() => {
          if ($featureFlags.debugSync) {
            console.log('setting', adapter.name, cached);
          }
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
      return _getPromise;
    }
    // TODO: get from all adapters, setting along the way?
    // TODO: this prefers (and waits for) remote data always - is that right?

    let previous = null;
    _getPromise = adapters.reverse()
      .reduce((promise, adapter) => {
        if (adapter.enabled) {
          return promise.then((value) => {
            if (value && !_.isEmpty(value)) {
              if ($featureFlags.debugSync) {
                console.log('got', value, 'from previous adapter ', previous);
              }
              return value;
            }
            previous = adapter.name;
            if ($featureFlags.debugSync) {
              console.log('getting from ', adapter.name);
            }
            return adapter.get();
          });
          // TODO: catch, set status
        }
        return promise;
      }, $q.when())
      .then((value) => {
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
      return $q.when();
    }

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
    get,
    set,
    remove,
    init,
    adapters
  };
}
