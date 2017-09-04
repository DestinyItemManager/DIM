import angular from 'angular';
import _ from 'underscore';

/**
 * The sync service allows us to save a single object to persistent
 * storage - potentially using multiple different storage
 * systems. Each system is a separate adapter that can be enabled or
 * disabled.
 */
export function SyncService(
  $q,
  IndexedDBStorage,
  GoogleDriveStorage
) {
  'ngInject';

  // Request persistent storage.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((persistent) => {
      if (persistent) {
        console.log("Sync: Storage will not be cleared except by explicit user action.");
      } else {
        console.log("Sync: Storage may be cleared under storage pressure.");
      }
    });
  }

  let cached;

  const adapters = [
    IndexedDBStorage,
    GoogleDriveStorage
  ].filter((a) => a.supported);

  /**
   * Write some key/value pairs to storage. This will write to each
   * adapter in order.

   * @param {object} value an object that will be merged with the saved data object and persisted.
   * @param {boolean} PUT if this is true, replace all data with value, rather than merging it
   */
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
      cached = angular.copy(value);
    } else {
      angular.extend(cached, angular.copy(value));
    }

    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        return promise
          .then(() => {
            if ($featureFlags.debugSync) {
              console.log('setting', adapter.name, cached);
            }
            return adapter.set(cached);
          })
          .catch((e) => {
            console.error('Sync: Error saving to', adapter.name, e);
            return null;
          });
      }
      return promise;
    }, $q.when());
  }

  let _getPromise = null;

  /**
   * Load all the saved data. This attempts to load from each adapter
   * in reverse order, and returns whatever produces a result first.
   *
   * @param {boolean} force bypass the in-memory cache.
   */
  // get DIM saved data
  function get(force) {
    // if we already have it and we're not forcing a sync
    if (cached && !force) {
      return $q.resolve(cached);
    }

    if (_getPromise) {
      return _getPromise;
    }

    let previous = null;
    _getPromise = adapters.slice().reverse()
      .reduce((promise, adapter) => {
        if (adapter.enabled) {
          return promise
            .then((value) => {
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
            })
            .catch((e) => {
              console.error('Sync: Error loading from', adapter.name, e);
              return null;
            });
        }
        return promise;
      }, $q.when())
      .then((value) => {
        cached = value || {};
        return angular.copy(cached);
      })
      .finally(() => {
        _getPromise = null;
      });
    return _getPromise;
  }

  /**
   * Remove one or more keys from storage. It is removed from all adapters.
   *
   * @param {string, Array<string>} keys to delete
   */
  function remove(key) {
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
