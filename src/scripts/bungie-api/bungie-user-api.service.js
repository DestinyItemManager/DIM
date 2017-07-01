import { bungieApiQuery } from './bungie-api-utils';

/**
 * UserService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function BungieUserApi(BungieServiceHelper, $http) {
  'ngInject';

  const { handleErrors } = BungieServiceHelper;

  return {
    getAccounts
  };

  function getAccounts(bungieMembershipId) {
    return $http(bungieApiQuery(`/Platform/User/GetMembershipsById/${bungieMembershipId}/254/`))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }
}