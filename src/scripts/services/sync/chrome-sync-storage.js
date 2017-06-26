/**
 * Storage that uses Chrome's extension sync mechanism. Only available
 * to extensions, and it has some limitation on storage.
 */
export function ChromeSyncStorage($q, $i18next) {
  'ngInject';

  return {
    get: function() {
      return new $q((resolve, reject) => {
        chrome.storage.sync.get(null, (data) => {
          if (chrome.runtime.lastError) {
            const message = chrome.runtime.lastError.message;
            reject(new Error(message));
          } else {
            resolve(data);
          }
        });
      });
    },

    set: function(value) {
      // TODO: move key-splitting logic into here?
      return new $q((resolve, reject) => {
        chrome.storage.sync.set(value, () => {
          if (chrome.runtime.lastError) {
            const message = chrome.runtime.lastError.message;
            if (message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
              reject(new Error($i18next.t('SyncService.OneItemTooLarge')));
            } else if (message.indexOf('QUOTA_BYTES') > -1) {
              reject(new Error($i18next.t('SyncService.SaveTooLarge')));
            } else {
              reject(new Error(message));
            }
          } else {
            resolve(value);
          }
        });
      });
    },

    remove: function(key) {
      return $q((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError));
          } else {
            resolve();
          }
        });
      });
    },

    // TODO: What if they aren't signed in?
    supported: (window.chrome && chrome.storage && chrome.storage.sync),
    enabled: true,
    name: 'ChromeSyncStorage'
  };
}
