/**
 * @typedef {Object} BungieAccount - A Bungie account is an account on Bungie.net, which is associated
 * with one or more Destiny accounts.
 * @property {number} membershipId - Bungie.net membership ID
 */

/**
 * A DIM user may associate one or more Bungie.net accounts with their
 * DIM account. These accounts are identified with a membership ID,
 * and have references to one or more Destiny accounts.
 */
export function BungieAccountService(OAuthTokenService) {
  'ngInject';

  // an observable for the accounts
  // save linked memberships in sync service
  // this replaces platform service?
  // membership ID, name, clan??
  // includes a way to get characters?

  return {
    getBungieAccounts
  };

  /**
   * Get the Bungie accounts for this DIM user. For now, we only have one (or none if you're not logged in.
   *
   * @return {Promise<BungieAccount[]>} a list of all the known Bungie accounts.
   */
  function getBungieAccounts() {
    const token = OAuthTokenService.getToken();

    if (token && token.bungieMembershipId) {
      return Promise.resolve([{
        membershipId: token.bungieMembershipId
      }]);
    }

    return Promise.resolve([]);
  }
}