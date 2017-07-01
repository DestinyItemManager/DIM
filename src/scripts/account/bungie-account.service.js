/**
 * A Bungie account is an account on Bungie.net, which is associated
 * with one or more Destiny accounts.
 */
class BungieAccount {
  /**
   * @param {String} membershipId
   */
  constructor(membershipId) {
    this.membershipId = membershipId;
  }
}

/**
 * A DIM user may associate one or more Bungie.net accounts with their
 * DIM account. These accounts are identified with a membership ID,
 * and have references to one or more Destiny accounts.
 */
export class BungieAccountService {
  constructor(OAuthTokenService) {
    'ngInject';
    this.OAuthTokenService = OAuthTokenService;
  }
  // an observable for the accounts
  // save linked memberships in sync service
  // this replaces platform service?
  // membership ID, name, clan??
  // includes a way to get characters?

  /**
   * Get the Bungie accounts for this DIM user. For now, we only have one (or none if you're not logged in.
   *
   * @return {Array<BungieAccount>} a list of all the known Bungie accounts.
   */
  getBungieAccounts() {
    const token = this.OAuthTokenService.getToken();

    if (token && token.bungieMembershipId) {
      return [
        new BungieAccount(token.membershipId)
      ];
    }

    return [];
  }
}