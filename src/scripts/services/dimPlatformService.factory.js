import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').factory('dimPlatformService', PlatformService);


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
    return dimBungieService.getAccounts()
      .then(generatePlatforms);
  }

  function generatePlatforms(bungieUser) {
    _platforms = bungieUser.destinyAccounts.map((destinyAccount) => {
      const account = {
        id: destinyAccount.userInfo.displayName,
        type: destinyAccount.userInfo.membershipType,
        // This is the destiny account ID
        membershipId: destinyAccount.userInfo.membershipId,
        // This is the Bungie account ID, which may have multiple destiny accounts
        // TODO: have a top-level Account object for this, instead of putting it in platform
        bungieMembershipId: bungieUser.bungieNetUser.membershipId
      };
      account.label = account.type === 1 ? 'Xbox' : 'PlayStation';
      return account;
    });

    $rootScope.$broadcast('dim-platforms-updated', { platforms: _platforms });

    getActivePlatform()
      .then(function(activePlatform) {
        setActive(activePlatform);
      });

    return _platforms;
  }

  function getActivePlatform() {
    return SyncService.get().then(function(data) {
      if (!_platforms.length) {
        return null;
      }

      if (_active && _.find(_platforms, { id: _active.id })) {
        return _active;
      } else if (data && data.platformType) {
        var active = _.find(_platforms, function(platform) {
          return platform.type === data.platformType;
        });
        if (active) {
          return active;
        }
      }
      return _platforms[0];
    });
  }

  function getActive() {
    return _active;
  }

  function setActive(platform) {
    _active = platform;
    var promise;

    if (platform === null) {
      promise = SyncService.remove('platformType');
    } else {
      promise = SyncService.set({ platformType: platform.type });
    }

    $rootScope.$broadcast('dim-active-platform-updated', { platform: _active });
    return promise;
  }
}

