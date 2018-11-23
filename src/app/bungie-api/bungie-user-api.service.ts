import {
  BungieMembershipType,
  getMembershipDataById,
  UserMembershipData
} from 'bungie-api-ts/user';
import { httpAdapter } from './bungie-service-helper';

/**
 * Get all accounts for this Bungie.net user.
 */
export async function getAccounts(bungieMembershipId: string): Promise<UserMembershipData> {
  const response = await getMembershipDataById(httpAdapter, {
    membershipId: bungieMembershipId,
    membershipType: BungieMembershipType.BungieNext
  });
  return response.Response;
}
