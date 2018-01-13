import { IPromise } from 'angular';
import { BungieMembershipType, getMembershipDataById, UserMembershipData } from 'bungie-api-ts/user';
import { BungieServiceHelperType } from './bungie-service-helper.service';

export interface BungieUserApiService {
  getAccounts(bungieMembershipId: string): IPromise<UserMembershipData>;
}

/**
 * UserService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function BungieUserApi(BungieServiceHelper: BungieServiceHelperType): BungieUserApiService {
  'ngInject';

  const { httpAdapter } = BungieServiceHelper;

  return {
    getAccounts(bungieMembershipId: string): IPromise<UserMembershipData> {
      return getMembershipDataById(httpAdapter, {
        membershipId: bungieMembershipId,
        membershipType: BungieMembershipType.BungieNext
      })
        .then((response) => response.Response) as IPromise<UserMembershipData>;
    }
  };
}
