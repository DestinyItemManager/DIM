import { getToken } from '../bungie-api/oauth-tokens';

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
 */
export function getBungieAccount(): BungieAccount | undefined {
  // In E2E mode, return mock Bungie account to bypass authentication
  if ($featureFlags.e2eMode) {
    return {
      membershipId: 'mock-bungie-membership-id',
    };
  }

  const token = getToken();
  if (token?.bungieMembershipId) {
    return {
      membershipId: token.bungieMembershipId,
    };
  }
}
