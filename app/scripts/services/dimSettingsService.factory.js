(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSettingsService', SettingsService);

  SettingsService.$inject = ['$q', '$rootScope', 'uuid2'];

  function SettingsService($q, $rootScope, uuid2) {
    var settingState;

    loadSettings();

    return {
      'getSetting': getSetting,
      'saveSetting': saveSetting
    };

    function loadSettings() {
      settingState = {
        itemDetails: false,
        condensed: false,
        characterOrder: 'mostRecent'
        //characterOrder: 'fixed'
      };
    }

    function getSetting(key) {
      return $q(function(resolve, reject) {
        if (_.isUndefined(key)) {
          resolve(settingState);
        } else if (_.has(settingState, key)) {
          resolve(_.propertyOf(settingState)(key));
        } else {
          reject([key, undefined]);
        }
      });
    }

    function saveSetting(key, value) {
      return $q(function(resolve) {
        settingState[key] = value;

        var kvp = {};

        kvp[key] = value;

        $rootScope.$broadcast('dim-settings-updated', kvp);

        resolve([key, value]);
      });
    }
  }
})();
