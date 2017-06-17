import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').factory('dimPlatformService', PlatformService);


function PlatformService($rootScope, $q, dimBungieService, SyncService, OAuthTokenService, OAuthService, $state, toaster) {
  var _platforms = [];
  var _active = null;

  var service = {
    getPlatforms: getPlatforms,
    getActive: getActive,
    setActive: setActive,
    reportBadPlatform: reportBadPlatform
  };

  return service;

  function getPlatforms() {
    const token = OAuthTokenService.getToken();
    if (!token) {
      // We're not logged in, don't bother
      $state.go('login');
      return $q.when();
    }

    if (token.bungieMembershipId) {
      return dimBungieService.getAccounts(token.bungieMembershipId)
        .then(generatePlatforms)
        .catch(function(e) {
          toaster.pop('error', 'Unexpected error getting accounts', e.message);
          throw e;
        });
    } else {
      // they're logged in, just need to fill in membership
      // TODO: this can be removed after everyone has had a chance to upgrade
      return dimBungieService.getAccountsForCurrentUser()
        .then(function(accounts) {
          const token = OAuthTokenService.getToken();
          token.bungieMembershipId = accounts.bungieNetUser.membershipId;
          OAuthTokenService.setToken(token);

          return accounts;
        })
        .then(generatePlatforms)
        .catch(function(e) {
          toaster.pop('error', 'Unexpected error getting accounts', e.message);
          throw e;
        });
    }
  }

  function generatePlatforms(accounts) {
    _platforms = accounts.destinyMemberships.map((destinyAccount) => {
      const account = {
        id: destinyAccount.displayName,
        type: destinyAccount.membershipType,
        membershipId: destinyAccount.membershipId
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

  // When we find a platform with no characters, remove it from the list and try something else.
  function reportBadPlatform(platform, e) {
    if (_platforms.length > 1) {
      _platforms = _platforms.filter((p) => p !== platform);
      $rootScope.$broadcast('dim-platforms-updated', { platforms: _platforms });
      setActive(_platforms[0]);
    } else {
      // Nothing we can do
      throw e;
    }
  }
}

