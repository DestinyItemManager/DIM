import { PLATFORMS } from '../bungie-api/platforms';

/**
 * @typedef {Object} DestinyAccount - a specific Destiny account (one per platform and Destiny version)
 * @property {string} displayName - Platform account name (gamertag or PSN ID)
 * @property {number} platformType - platform ID
 * @property {string} platformLabel - readable platform name
 * @property {string} membershipId - Destiny membership ID
 */

/**
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 *
 * We don't know whether or not the account is associated with D1 or D2 characters until we
 * try to load them.
 */
export function DestinyAccountService(BungieUserApi, toaster) {
  'ngInject';

  return {
    getDestinyAccountsForBungieAccount
  };

  /**
   * Get all Destiny accounts associated with a Bungie account
   * @param {number} bungieMembershipId Bungie.net membership ID
   * @return {Promise<DestinyAccount[]>}
   */
  function getDestinyAccountsForBungieAccount(bungieMembershipId) {
    return BungieUserApi.getAccounts(bungieMembershipId)
      .then(generatePlatforms)
      .catch((e) => {
        toaster.pop('error', `Unexpected error getting Destiny accounts for Bungie account ${bungieMembershipId}`, e.message);
        throw e;
      });
  }

  /**
   * @param {{destinyMemberships: Object[]}} accounts raw Bungie API accounts response
   * @return {DestinyAccount[]}
   */
  function generatePlatforms(accounts) {
    return accounts.destinyMemberships.map((destinyAccount) => {
      /** @type {DestinyAccount} */
      const account = {
        displayName: destinyAccount.displayName,
        platformType: destinyAccount.membershipType,
        membershipId: destinyAccount.membershipId
      };
      account.platformLabel = PLATFORMS[account.platformType].label;
      return account;
    });
  }
}

/**
 * @return {boolean} whether the accounts represent the same account
 */
export function compareAccounts(account1, account2) {
  return account1.platformType === account2.platformType &&
         account1.membershipId === account2.membershipId;
}