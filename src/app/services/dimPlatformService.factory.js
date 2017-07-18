import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').factory('dimPlatformService', PlatformService);


function PlatformService($rootScope, BungieAccountService, DestinyAccountService, SyncService, $state, $q, dimState) {
  let _platforms = [];
  let _active = null;

  const service = {
    getPlatforms,
    getActive,
    setActive,
    reportBadPlatform,
    getPlatformMatching
  };

  return service;

  function getPlatformMatching(params) {
    return _.find(_platforms, params);
  }

  /**
   * @return {DestinyAccount[]}
   */
  // TODO: return a list of bungie accounts and associated destiny accounts?
  function getPlatforms() {
    if (_platforms.length) {
      return $q.resolve(_platforms);
    }

    // TODO: wire this up with observables?
    return BungieAccountService.getBungieAccounts()
      .then((bungieAccounts) => {
        if (!bungieAccounts.length) {
          // We're not logged in, don't bother
          $rootScope.$broadcast('dim-no-token-found');
          return [];
        }

        // We only support one account now
        const membershipId = bungieAccounts[0].membershipId;
        return DestinyAccountService.getDestinyAccountsForBungieAccount(membershipId);
      })
      .then((destinyAccounts) => {
        _platforms = destinyAccounts;
        $rootScope.$broadcast('dim-platforms-updated', { platforms: _platforms });
        return getActivePlatform();
      })
      .then(setActive)
      .then(() => _platforms);
  }

  function getActivePlatform() {
    return SyncService.get().then((data) => {
      if (!_platforms.length) {
        return null;
      }

      if (_active && _.find(_platforms, { id: _active.id })) {
        return _active;
      } else if (data && data.platformType) {
        const active = _.find(_platforms, (platform) => {
          return platform.platformType === data.platformType;
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
    let promise;

    if (platform === null) {
      promise = SyncService.remove('platformType');
    } else {
      promise = SyncService.set({ platformType: platform.platformType });
    }

    dimState.active = platform;
    $rootScope.$broadcast('dim-active-platform-updated', { platform: _active });
    return promise;
  }

  // When we find a platform with no characters, remove it from the list and try something else.
  function reportBadPlatform(platform, e) {
    // TODO: push this up to DestinyAccountService

    if (_platforms.length > 1) {
      _platforms = _platforms.filter((p) => p !== platform);
      $rootScope.$broadcast('dim-platforms-updated', { platforms: _platforms });
      setActive(_platforms[0]);
      $state.go('destiny1'); // try for another platform
    } else {
      // Nothing we can do
      throw e;
    }
  }
}

