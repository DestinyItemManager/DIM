import angular from 'angular';
import { bungieApiUpdate } from '../services/bungie-api-utils';

export function OAuthService($injector) {
  'ngInject';

  function handleAccessToken(response) {
    if (response && response.data && (response.data.ErrorCode === 1) && response.data.Response && response.data.Response.accessToken) {
      const data = response.data.Response;
      const inception = Date.now();
      const accessToken = angular.merge({}, data.accessToken, { name: 'access', inception: inception });
      const refreshToken = angular.merge({}, data.refreshToken, { name: 'refresh', inception: inception });

      return {
        accessToken,
        refreshToken,
        scope: data.scope,
        bungieMembershipId: data.membershipId
      };
    } else {
      throw response;
    }
  }

  function getAccessTokenFromRefreshToken(refreshToken) {
    // Break a circular dependency
    const $http = $injector.get('$http');

    return $http(bungieApiUpdate(
      '/Platform/App/GetAccessTokensFromRefreshToken/',
      {
        refreshToken: refreshToken.value
      }
    ))
      .then(handleAccessToken);
  }

  function getAccessTokenFromCode(code) {
    // Break a circular dependency
    const $http = $injector.get('$http');

    return $http(bungieApiUpdate(
      '/Platform/App/GetAccessTokensFromCode/',
      {
        code
      }
    ))
      .then(handleAccessToken);
  }

  return {
    getAccessTokenFromRefreshToken,
    getAccessTokenFromCode
  };
}

