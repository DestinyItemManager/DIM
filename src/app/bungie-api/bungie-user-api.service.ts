import { bungieApiQuery } from './bungie-api-utils';
import { IPromise } from 'angular';
import { UserMembershipData } from 'bungie-api-ts/user';

export interface BungieUserApiService {
  getAccounts(bungieMembershipId: string): IPromise<UserMembershipData>;
}

/**
 * UserService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function BungieUserApi(BungieServiceHelper, $http): BungieUserApiService {
  'ngInject';

  const { handleErrors } = BungieServiceHelper;

  return {
    getAccounts
  };

  function getAccounts(bungieMembershipId: string): IPromise<UserMembershipData> {
    return $http(bungieApiQuery(`/Platform/User/GetMembershipsById/${bungieMembershipId}/254/`))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }
}
