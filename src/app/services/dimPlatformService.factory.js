import angular from 'angular';
import _ from 'underscore';

import { ReplaySubject } from 'rxjs/ReplaySubject';

angular.module('dimApp').factory('dimPlatformService', PlatformService);

// TODO: push "current account" into the other account services
function PlatformService($rootScope, BungieAccountService, DestinyAccountService, SyncService, $q, dimState) {
  let _platforms = [];
  let _active = null;

  const current$ = new ReplaySubject(1);

  const service = {
    getPlatforms,
    getActive,
    setActive,
    getPlatformMatching,
    current$
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
        return getActivePlatform();
      })
      .then(setActive)
      .then(() => _platforms);
  }

  function getActivePlatform() {
    if (_active && _.find(_platforms, { id: _active.id })) {
      return _active;
    }

    return SyncService.get().then((data) => {
      if (!_platforms.length) {
        return null;
      }

      if (_active && _.find(_platforms, { id: _active.id })) {
        return _active;
      } else if (data && data.platformType) {
        let active = _.find(_platforms, (platform) => {
          return platform.platformType === data.platformType && platform.destinyVersion === data.destinyVersion;
        });
        if (active) {
          return active;
        }
        active = _.find(_platforms, (platform) => {
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
    current$.next(platform);
    let promise;

    if (platform === null) {
      promise = SyncService.remove('platformType');
    } else {
      promise = SyncService.set({ platformType: platform.platformType, destinyVersion: platform.destinyVersion });
    }

    dimState.active = platform;
    return promise.then(() => platform);
  }
}

