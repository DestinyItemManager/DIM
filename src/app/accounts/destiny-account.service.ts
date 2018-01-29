import { StateService } from '@uirouter/angularjs';
import { IPromise, IQService } from 'angular';
import { BungieMembershipType } from 'bungie-api-ts/common';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { UserMembershipData } from 'bungie-api-ts/user';
import { t } from 'i18next';
import * as _ from 'underscore';
import { BungieUserApiService } from '../bungie-api/bungie-user-api.service';
import { Destiny2ApiService } from '../bungie-api/destiny2-api.service';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { PLATFORMS } from '../bungie-api/platforms';
import { reportExceptionToGoogleAnalytics } from '../google';
import { flatMap } from '../util';

/** A specific Destiny account (one per platform and Destiny version) */
export interface DestinyAccount {
  /** Platform account name (gamertag or PSN ID) */
  displayName: string;
  /** platform ID */
  platformType: BungieMembershipType;
  /** readable platform name */
  platformLabel: string;
  /** Destiny membership ID */
  membershipId: string;
  /** Which version of Destiny is this account for? */
  destinyVersion: 1 | 2;
}

/**
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 *
 * We don't know whether or not the account is associated with D1 or D2 characters until we
 * try to load them.
 */
export function DestinyAccountService(
  BungieUserApi: BungieUserApiService,
  Destiny1Api,
  Destiny2Api: Destiny2ApiService,
  toaster,
  $q: IQService,
  OAuthTokenService,
  $state: StateService
) {
  'ngInject';

  return {
    getDestinyAccountsForBungieAccount
  };

  /**
   * Get all Destiny accounts associated with a Bungie account
   * @param bungieMembershipId Bungie.net membership ID
   */
  function getDestinyAccountsForBungieAccount(bungieMembershipId: string): IPromise<DestinyAccount[]> {
    return BungieUserApi.getAccounts(bungieMembershipId)
      .then(generatePlatforms)
      .then((platforms) => {
        if (platforms.length === 0) {
          toaster.pop('warning', t('Accounts.NoCharacters'));
          OAuthTokenService.removeToken();
          $state.go('login', { reauth: true });
        }
        return platforms;
      })
      .catch((e) => {
        // TODO: show a full-page error, or show a diagnostics page, rather than a popup
        toaster.pop(bungieErrorToaster(e));
        reportExceptionToGoogleAnalytics('getDestinyAccountsForBungieAccount', e);
        throw e;
      });
  }

  /**
   * @param accounts raw Bungie API accounts response
   */
  function generatePlatforms(accounts: UserMembershipData): IPromise<DestinyAccount[]> {
    const accountPromises = flatMap(accounts.destinyMemberships, (destinyAccount) => {
      const account: DestinyAccount = {
        displayName: destinyAccount.displayName,
        platformType: destinyAccount.membershipType,
        membershipId: destinyAccount.membershipId,
        platformLabel: PLATFORMS[destinyAccount.membershipType].label,
        destinyVersion: 1
      };
      // PC only has D2
      return destinyAccount.membershipType === BungieMembershipType.TigerBlizzard
        ? [findD2Characters(account)]
        : [findD2Characters(account), findD1Characters(account)];
    });

    const allPromise = $q.all(accountPromises) as IPromise<(DestinyAccount | null)[]>;
    return allPromise.then((accounts) => _.compact(accounts) as DestinyAccount[]);
  }

  function findD2Characters(account: DestinyAccount): IPromise<DestinyAccount | null> {
    return Destiny2Api
      .getBasicProfile(account)
      .then((response) => {
        if (response.profile &&
          response.profile.data &&
          response.profile.data.characterIds &&
          response.profile.data.characterIds.length) {
          const result: DestinyAccount = {
            ...account,
            destinyVersion: 2
          };
          return result;
        }
        return null;
      })
      .catch((e) => {
        if (e.code && e.code === PlatformErrorCodes.DestinyAccountNotFound) {
          return null;
        }
        throw e;
      });
  }

  function findD1Characters(account): IPromise<any | null> {
    return Destiny1Api
      .getCharacters(account)
      .then((response) => {
        if (response && response.length) {
          const result: DestinyAccount = {
            ...account,
            destinyVersion: 1
          };
          return result;
        }
        return null;
      })
      .catch((e) => {
        if (e.code && e.code === PlatformErrorCodes.DestinyAccountNotFound) {
          return null;
        }
        throw e;
      });
  }
}

/**
 * @return whether the accounts represent the same account
 */
export function compareAccounts(account1: DestinyAccount, account2: DestinyAccount): boolean {
  return account1.platformType === account2.platformType &&
         account1.membershipId === account2.membershipId &&
         account2.destinyVersion === account2.destinyVersion;
}
