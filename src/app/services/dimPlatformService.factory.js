import angular from 'angular';
import _ from 'underscore';
import { compareAccounts } from '../accounts/destiny-account.service';
import { Subject } from 'rxjs/Subject';

angular.module('dimApp').factory('dimPlatformService', PlatformService);

// TODO: push "current account" into the other account services
function PlatformService($rootScope, BungieAccountService, DestinyAccountService, SyncService, $q, dimState, dimSettingsService) {
  let _platforms = [];
  let _active = null;

  // Set the active platform here - it'll drive the other observable
  const activePlatform$ = new Subject();

  const current$ = activePlatform$
    .distinctUntilChanged(compareAccounts)
    .do(saveActivePlatform)
    .publishReplay(1);

  const service = {
    getPlatforms,
    getActive,
    setActive,
    getPlatformMatching,
    getActiveAccountStream
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
    if (_active && _platforms.find((p) => p.id === _active.id)) {
      return _active;
    }

    return SyncService.get().then((data) => {
      if (!_platforms.length) {
        return null;
      }

      if (_active && _platforms.find((p) => p.id === _active.id)) {
        return _active;
      } else if (data && data.platformType) {
        let active = _platforms.find((platform) => {
          return platform.platformType === data.platformType && platform.destinyVersion === data.destinyVersion;
        });
        if (active) {
          return active;
        }
        active = _platforms.find((platform) => {
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

  function getActiveAccountStream() {
    current$.connect();
    return current$;
  }

  function saveActivePlatform(account) {
    // TODO: kill platform label
    _active = account;
    dimState.active = account;
    if (account === null) {
      SyncService.remove('platformType');
    } else {
      if (dimSettingsService.destinyVersion !== account.destinyVersion) {
        dimSettingsService.destinyVersion = account.destinyVersion;
        dimSettingsService.save();
      }
      SyncService.set({ platformType: account.platformType, destinyVersion: account.destinyVersion });
    }
  }

  function setActive(platform) {
    activePlatform$.next(platform);
    return current$.take(1).toPromise();
  }
}

