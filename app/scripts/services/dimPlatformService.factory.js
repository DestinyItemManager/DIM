(function() {
  'use strict';

  angular.module('dimApp').factory('dimPlatformService', PlatformService);

  PlatformService.$inject = ['$rootScope', '$q', 'dimBungieService', 'SyncService'];

  function PlatformService($rootScope, $q, dimBungieService, SyncService) {
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
        .then(generatePlatforms);

      return dataPromise;
    }

    function generatePlatforms(response) {
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
      var promise = SyncService.get().then(function(data) {
        var previousPlatform = null;
        var active = null;
        var previousPlatformType = null;

        if (data) {
          previousPlatformType = data.platformType;
        }

        if (!_.isNull(previousPlatformType)) {
          previousPlatform = _.find(_platforms, function(platform) {
            return platform.type === previousPlatformType;
          });
        }

        if (_.size(_platforms) > 0) {
          if (active === null) {
            active = previousPlatform || _platforms[0];
          } else if (_.find(_platforms, { id: _active.id })) {
            active = _active;
          } else {
            active = _platforms[0];
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

      if (platform === null) {
        promise = SyncService.remove('platformType');
      } else {
        promise = SyncService.set({ platformType: platform.type });
      }

      $rootScope.activePlatformUpdated = true;

      $rootScope.$broadcast('dim-active-platform-updated', { platform: _active });
      return promise;
    }
  }
})();
