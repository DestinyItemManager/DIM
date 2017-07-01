class DestinyAccount {
  constructor({ destinyVersion, membershipId }) {
    this.destinyVersion = destinyVersion;
    this.membershipId = membershipId;
  }
}

/**
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 */
class DestinyAccountService {
  /**
   * @param {BungieUserApi} BungieUserApi
   */
  constructor(BungieUserApi) {
    'ngInject';
    this.BungieUserApi = BungieUserApi;
  }

  /**
   * @param {BungieAccount} bungieAccount
   */
  getDestinyAccountsForBungieAccount(bungieAccount) {
      return BungieUserApi.getAccounts(token.bungieMembershipId)
        .then(generatePlatforms)
        .catch((e) => {
          toaster.pop('error', 'Unexpected error getting accounts', e.message);
          throw e;
        });
    } else {
      // they're logged in, just need to fill in membership
      // TODO: this can be removed after everyone has had a chance to upgrade
      return BungieUserApi.getAccountsForCurrentUser()
        .then((accounts) => {
          const token = OAuthTokenService.getToken();
          token.bungieMembershipId = accounts.bungieNetUser.membershipId;
          OAuthTokenService.setToken(token);

          return accounts;
        })
        .then(generatePlatforms)
        .catch((e) => {
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
      .then((activePlatform) => {
        setActive(activePlatform);
      });

    return _platforms;
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
    let promise;

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