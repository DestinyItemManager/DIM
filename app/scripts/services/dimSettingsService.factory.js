(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSettingsService', SettingsService);

  SettingsService.$inject = ['$q', '$rootScope'];

  function SettingsService($q, $rootScope) {
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
        itemQuality: false,
        showElements: false,
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

              diff.forEach(function(key) {
                currentSettings[key] = settingState[key];
              });

              if (diff.length > 0) {
                saveSettings();
              }
            } else {
              currentSettings = angular.copy(settingState);
              saveSettings();
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
          if (!key) {
            return settings;
          } else if (_.has(settings, key)) {
            return settings[key];
          } else {
            return $q.reject("The key is not defined in the settings.");
          }
        });
    }

    function saveSetting(key, value) {
      return getSetting()
        .then(function(settings) {
          settings[key] = value;
          var data = {
            "settings-v1.0": settings
          };
          var kvp = {};
          kvp[key] = value;

          return $q(function(resolve, reject) {
            chrome.storage.sync.set(data, function(e) {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                $rootScope.$apply(function() {
                  $rootScope.$broadcast('dim-settings-updated', kvp);
                });
                resolve(true);
              }
            });
          });
        });
    }

    function saveSettings() {
      return getSetting()
        .then(function(settings) {
          var data = {
            "settings-v1.0": settings
          };

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
