import { PLATFORMS } from '../bungie-api/platforms';
import { BungieMembershipType } from '../../../../bungie-api-ts/lib/destiny2/index';
import { IPromise } from 'angular';
import { BungieUserApiService } from '../bungie-api/bungie-user-api.service';
import { UserMembershipData } from 'bungie-api-ts/user';

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
}

/**
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 *
 * We don't know whether or not the account is associated with D1 or D2 characters until we
 * try to load them.
 */
export function DestinyAccountService(BungieUserApi: BungieUserApiService, toaster) {
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
      .catch((e) => {
        toaster.pop('error', `Unexpected error getting Destiny accounts for Bungie account ${bungieMembershipId}`, e.message);
        throw e;
      });
  }

  /**
   * @param accounts raw Bungie API accounts response
   */
  function generatePlatforms(accounts: UserMembershipData): DestinyAccount[] {
    return accounts.destinyMemberships.map((destinyAccount) => {
      return {
        displayName: destinyAccount.displayName,
        platformType: destinyAccount.membershipType,
        membershipId: destinyAccount.membershipId,
        platformLabel: PLATFORMS[destinyAccount.membershipType].label
      };
    });
  }
}

/**
 * @return whether the accounts represent the same account
 */
export function compareAccounts(account1: DestinyAccount, account2: DestinyAccount): boolean {
  return account1.platformType === account2.platformType &&
         account1.membershipId === account2.membershipId;
}
