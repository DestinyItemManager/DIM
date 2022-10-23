import { DestinyAccount } from './accounts/destiny-account';

/**
 * This file contains helpers for generating route paths, though generally our
 * paths are simple.
 */

export const accountRoute = (account: Pick<DestinyAccount, 'membershipId' | 'destinyVersion'>) =>
  `/${account.membershipId}/d${account.destinyVersion}`;
