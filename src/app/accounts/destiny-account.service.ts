import { IPromise } from 'angular';
import { BungieMembershipType } from 'bungie-api-ts/common';
import { PlatformErrorCodes, DestinyGameVersions } from 'bungie-api-ts/destiny2';
import { UserMembershipData } from 'bungie-api-ts/user';
import { t } from 'i18next';
import { $q } from 'ngimport';
import * as _ from 'underscore';
import { getAccounts } from '../bungie-api/bungie-user-api.service';
import { getCharacters } from '../bungie-api/destiny1-api';
import { getBasicProfile } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { reportException } from '../exceptions';
import { toaster } from '../ngimport-more';
import { removeToken } from '../oauth/oauth-token.service';
import { flatMap } from '../util';
import { DimError } from '../bungie-api/bungie-service-helper';
import { router } from '../../router';

/**
 * Platform types (membership types) in the Bungie API.
 */
export const PLATFORM_LABELS = {
  [BungieMembershipType.TigerXbox]: 'Xbox',
  [BungieMembershipType.TigerPsn]: 'PlayStation',
  [BungieMembershipType.TigerBlizzard]: 'Blizzard',
  [BungieMembershipType.TigerDemon]: 'Demon',
  [BungieMembershipType.BungieNext]: 'Bungie.net'
};

/** A specific Destiny account (one per platform and Destiny version) */
export interface DestinyAccount {
  /** Platform account name (gamertag or PSN ID) */
  readonly displayName: string;
  /** platform ID */
  readonly platformType: BungieMembershipType;
  /** readable platform name */
  readonly platformLabel: string;
  /** Destiny membership ID */
  readonly membershipId: string;
  /** Which version of Destiny is this account for? */
  readonly destinyVersion: 1 | 2;
  /** Which version of Destiny 2 / DLC do they own? */
  readonly versionsOwned?: DestinyGameVersions;
}

/**
 * Get all Destiny accounts associated with a Bungie account.
 *
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 *
 * We don't know whether or not the account is associated with D1 or D2 characters until we
 * try to load them.
 *
 * @param bungieMembershipId Bungie.net membership ID
 */
export function getDestinyAccountsForBungieAccount(
  bungieMembershipId: string
): IPromise<DestinyAccount[]> {
  return getAccounts(bungieMembershipId)
    .then(generatePlatforms)
    .then((platforms) => {
      if (platforms.length === 0) {
        toaster.pop('warning', t('Accounts.NoCharacters'));
        removeToken();
        router.stateService.go('login', { reauth: true });
      }
      return platforms;
    })
    .catch((e: DimError) => {
      // TODO: show a full-page error, or show a diagnostics page, rather than a popup
      toaster.pop(bungieErrorToaster(e));
      reportException('getDestinyAccountsForBungieAccount', e);
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
      platformLabel: PLATFORM_LABELS[destinyAccount.membershipType],
      destinyVersion: 1
    };
    // PC only has D2
    return destinyAccount.membershipType === BungieMembershipType.TigerBlizzard
      ? [findD2Characters(account)]
      : [findD2Characters(account), findD1Characters(account)];
  });

  const allPromise = $q.all(accountPromises) as IPromise<(DestinyAccount | null)[]>;
  return allPromise.then((accounts) => _.compact(accounts));
}

function findD2Characters(account: DestinyAccount): IPromise<DestinyAccount | null> {
  return getBasicProfile(account)
    .then((response) => {
      if (
        response.profile &&
        response.profile.data &&
        response.profile.data.characterIds &&
        response.profile.data.characterIds.length
      ) {
        const result: DestinyAccount = {
          ...account,
          destinyVersion: 2,
          versionsOwned: response.profile.data.versionsOwned
        };
        return result;
      }
      return null;
    })
    .catch((e: DimError) => {
      if (e.code && e.code === PlatformErrorCodes.DestinyAccountNotFound) {
        return null;
      }
      console.error('Error getting D2 characters for', account, e);
      reportException('findD2Characters', e);

      // We don't know what this error is but it isn't the API telling us there's no account - return the account anyway, as if it had succeeded.
      const result: DestinyAccount = {
        ...account,
        destinyVersion: 2
      };
      return result;
    });
}

function findD1Characters(account: DestinyAccount): IPromise<any | null> {
  return getCharacters(account)
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
    .catch((e: DimError) => {
      if (
        e.code &&
        (e.code === PlatformErrorCodes.DestinyAccountNotFound ||
          e.code === PlatformErrorCodes.DestinyLegacyPlatformInaccessible)
      ) {
        return null;
      }
      console.error('Error getting D1 characters for', account, e);
      reportException('findD1Characters', e);

      // We don't know what this error is but it isn't the API telling us there's no account - return the account anyway, as if it had succeeded.
      const result: DestinyAccount = {
        ...account,
        destinyVersion: 1
      };
      return result;
    });
}

/**
 * @return whether the accounts represent the same account
 */
export function compareAccounts(account1: DestinyAccount, account2: DestinyAccount): boolean {
  return (
    account1.platformType === account2.platformType &&
    account1.membershipId === account2.membershipId &&
    account1.destinyVersion === account2.destinyVersion
  );
}
