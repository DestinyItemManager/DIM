import { getToken } from '../oauth/oauth-token.service';

/**
 * A Bungie account is an account on Bungie.net, which is associated
 * with one or more Destiny accounts.
 */
export interface BungieAccount {
  /** Bungie.net membership ID */
  membershipId: string;
}

/**
 * Get the Bungie accounts for this DIM user. For now, we only have one (or none if you're not logged in).
 *
 * A DIM user may associate one or more Bungie.net accounts with their
 * DIM account. These accounts are identified with a membership ID,
 * and have references to one or more Destiny accounts.
 *
 * @return a list of all the known Bungie accounts.
 */
export function getBungieAccounts(): Promise<BungieAccount[]> {
  const token = getToken();

  if (token && token.bungieMembershipId) {
    return Promise.resolve([
      {
        membershipId: token.bungieMembershipId
      }
    ]);
  }

  return Promise.resolve([]);
}
