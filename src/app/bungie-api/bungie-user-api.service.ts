import { IPromise } from 'angular';
import { BungieMembershipType, getMembershipDataById, UserMembershipData } from 'bungie-api-ts/user';
import { httpAdapter } from './bungie-service-helper';

/**
 * Get all accounts for this Bungie.net user.
 */
export function getAccounts(bungieMembershipId: string): IPromise<UserMembershipData> {
  return getMembershipDataById(httpAdapter, {
    membershipId: bungieMembershipId,
    membershipType: BungieMembershipType.BungieNext
  })
    .then((response) => response.Response) as IPromise<UserMembershipData>;
}
