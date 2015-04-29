(function() {
  'use strict';

  angular.module('dimApp').factory('dimPlatformService', PlatformService);

  PlatformService.$inject = ['$rootScope', '$q', 'dimBungieService', 'chromeStorage'];

  function PlatformService($rootScope, $q, dimBungieService, chromeStorage) {
    var _platforms = [];
    var _active = null;

    var service = {
      getPlatforms: getPlatforms,
      getActive: getActive,
      setActive: setActive
    };

    return service;

    function getPlatforms() {
      var dataPromise = dimBungieService.getPlatforms()
        .then(generatePlatfroms);

      return dataPromise;
    }

    function generatePlatfroms(response) {
      var bungieUser = response.data.Response;

      _platforms.splice(0);

      if (bungieUser.gamerTag) {
        _platforms.push({
          id: bungieUser.gamerTag,
          type: 1,
          label: 'Xbox'
        });
      }

      if (bungieUser.psnId) {
        _platforms.push({
          id: bungieUser.psnId,
          type: 2,
          label: 'PlayStation'
        });
      }

      $rootScope.$broadcast('dim-platforms-updated', { platforms: _platforms });

      getActivePlatform()
        .then(function(activePlatform) {
          setActive(activePlatform);
        });

      return _platforms;
    }

    function getActivePlatform() {
      var promise = chromeStorage.get('platformType').then(function(previousPlatformType) {
        if (_.isUndefined(previousPlatformType)) {
          previousPlatformType = null;
        }

        var previousPlatform = null;
        var active = null;

        if (!_.isNull(previousPlatformType)) {
          previousPlatform = _.find(_platforms, function(platform) {
            return platform.type === previousPlatformType;
          });
        }

        if (_.size(_platforms) > 0) {
          if (_.isNull(_active)) {
            active = previousPlatform || _platforms[0];
          } else {
            if (!_.find(_platforms, function(platform) {
              return (platform.id === _active.id);
            })) {
              active = _platforms[0];
            } else {
              active = _active;
            }
          }
        } else {
          active = null;
        }

        return active;
      });

      return promise;
    }

    function getActive() {
      return (_active);
    }

    function setActive(platform) {
      _active = platform;
      var promise;

      if (_.isNull(platform)) {
        promise = chromeStorage.drop('platformType');
      } else {
        promise = chromeStorage.set('platformType', platform.type);
      }

      $rootScope.$broadcast('dim-active-platform-updated', { platform: _active });
    }
  }
})();
