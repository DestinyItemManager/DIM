(function() {
  'use strict';

  angular.module('dimApp')
    .constant('dimItemSort', {
      primaryStat: 'primaryStat'
    });

  angular.module('dimApp')
    .constant('dimCharacterOrder', {
      mostRecent: 'mostRecent'
    });

  angular.module('dimApp')
    .factory('dimSettingsService', SettingsService);

  SettingsService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemSort', 'dimCharacterOrder'];

  function SettingsService($q, $rootScope, uuid2, itemSort, characterOrder) {
    var _base = {
      hideFilteredItems: false,
      itemDetails: false,
      itemStat: false,
      condensed: false,
      characterOrder: characterOrder.mostRecent,
      itemSort: itemSort.primaryStat,
      charCol: 3,
      vaultCol: 4
    };

    var _init = false;
    var _current = {};
    var _discriminator = 'settings-v1.0';

    getSettings();

    return {
      current:      _current,
      getSetting:   getSetting,
      getSettings:  getSettings,
      saveSetting:  saveSetting,
      saveSettings: saveSettings
    };

    function getSettingsFromLocalStorage() {
      return $q(function(resolve, reject) {
        if (chrome && chrome.storage) {
          chrome.storage.sync.get(null, function processStorageSettings(data) {
            if (_.has(data, _discriminator)) {
              _.extend(_current, data[_discriminator]);
              // _current = data[_discriminator];
              //
              // var currentKeys = _.keys(_current);
              // var defaultKeys = _.keys(_base);
              // var diff = _.difference(defaultKeys, currentKeys);
              //
              // _.each(diff, function(key) {
              //   if ((key === 'charCol') && _current.condensed) {
              //     _current.charCol = 4;
              //   } else if ((key === 'vaultCol') && _current.condensed) {
              //     _current.vaultCol = 6;
              //   } else {
              //     _current[key] = _base[key];
              //   }
              // });
            } else {
              _current = _.clone(_base);
            }

            resolve(_current);
            _init = true;
          });
        } else {
          _current = _.clone(_base);
          resolve(_current);
          _init = true;
        }
      });
    }

    function getSetting(key) {
      return getSettings()
        .then(function(settings) {
          if (_.has(settings, key)) {
            return settings[key];
          } else {
            return $q.reject("The key is not defined in the settings.");
          }
        });
    }

    function getSettings() {
      if (_init) {
        return $q.when(_current);
      } else {
        return getSettingsFromLocalStorage();
      }
    }

    function saveSetting(key, value) {
      return getSettings()
        .then(function(settings) {
          settings[key] = value;

          return saveSettings();
        });
    }

    function saveSettings() {
      return getSettings()
        .then(function(settings) {
          var data = {};

          data[_discriminator] = settings;

          return $q(function(resolve, reject) {
            chrome.storage.sync.set(data, function(e) {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(true);
              }
            });
          });
        });
    }
  }
})();
