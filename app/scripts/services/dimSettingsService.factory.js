(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSettingsService', SettingsService);

  SettingsService.$inject = ['$q', '$rootScope', 'uuid2'];

  function SettingsService($q, $rootScope, uuid2) {
    var settingState;
    var currentSettings = null;

    return {
      'getSetting': getSetting,
      'getSettings': getSettings,
      'saveSetting': saveSetting
    };

    function loadSettings() {
      settingState = {
        hideFilteredItems: false,
        itemDetails: false,
        itemStat: false,
        condensed: false,
        characterOrder: 'mostRecent',
        itemSort: 'primaryStat',
        charCol: 3,
        vaultCol: 4
      };

      if (currentSettings !== null) {
        return $q.when(currentSettings);
      } else {
        return $q(function(resolve, reject) {
          function processStorageSettings(data) {
            if (_.has(data, "settings-v1.0")) {
              currentSettings = data["settings-v1.0"];

              var currentKeys = _.keys(currentSettings);
              var defaultKeys = _.keys(settingState);
              var diff = _.difference(defaultKeys, currentKeys);

              _.each(diff, function(key) {
                if ((key === 'charCol') && currentSettings.condensed) {
                  currentSettings.charCol = 4;
                } else if ((key === 'vaultCol') && currentSettings.condensed) {
                  currentSettings.vaultCol = 6;
                } else {
                  currentSettings[key] = settingState[key];
                }

              });

              if (diff.length > 0) {
                saveSettings();
              }
            } else {
              currentSettings = _.clone(settingState);

              saveSettings()
            }

            resolve(currentSettings);
          }

          chrome.storage.sync.get(null, processStorageSettings);
        });
      }
    }

    function getSettings() {
      return loadSettings();
    }

    function getSetting(key) {
      return loadSettings()
        .then(function(settings) {
          if (_.isUndefined(key)) {
            return settings;
          } else if (_.has(settings, key)) {
            return _.propertyOf(settings)(key);
          } else if (_.has(settingState, key)) {
            // Found default
            settings[key] = settingState[key];
            saveSetting(key, settingState[key]);
          } else {
            return $q.reject("The key is not defined in the settings.");
          }
        });
    }

    function saveSetting(key, value) {
      return getSetting()
        .then(function(settings) {
          settings[key] = value;
          var data = {};
          var kvp = {};

          kvp[key] = value;

          data["settings-v1.0"] = settings;

          chrome.storage.sync.set(data, function(e) {
            if (chrome.runtime.lastError) {
              $q.reject(chrome.runtime.lastError);
            } else {
              $rootScope.$broadcast('dim-settings-updated', kvp);
              return true;
            }
          });
        });
    }

    function saveSettings() {
      return getSetting()
        .then(function(settings) {
          var data = {};

          data["settings-v1.0"] = settings;

          chrome.storage.sync.set(data, function(e) {
            if (chrome.runtime.lastError) {
              $q.reject(chrome.runtime.lastError);
            } else {
              return true;
            }
          });
        });
    }
  }
})();
