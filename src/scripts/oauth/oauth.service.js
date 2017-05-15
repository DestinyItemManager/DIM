import angular from 'angular';
import { bungieApiUpdate } from '../services/bungie-api-utils';

export function OAuthService($q, $injector, localStorageService, OAuthTokenService) {
  'ngInject';

  function isAuthenticated() {
    return Boolean(OAuthTokenService.getToken());
  }

  function getToken() {
    // Gets an access token from service.
  }

  function refreshToken() {
    const $http = $injector.get('$http');

    return $http(bungieApiUpdate(
      '/Platform/App/GetAccessTokensFromRefreshToken/',
      {
        refreshToken: OAuthTokenService.getRefreshToken().value
      }
    ))
    .then((response) => {
      if (response && response.data && (response.data.ErrorCode === 1) && response.data.Response && response.data.Response.accessToken) {
        const inception = Date.now();
        const accessToken = angular.merge({}, response.data.Response.accessToken, { name: 'access', inception: inception });
        const refreshToken = angular.merge({}, response.data.Response.refreshToken, { name: 'refresh', inception: inception });

        OAuthTokenService.setToken({
          accessToken,
          refreshToken,
          scope: response.data.Response.scope
        });

        return OAuthTokenService.getToken();
      } else {
        return $q.reject(response);
      }
    });
  }

  return {
    isAuthenticated,
    getToken,
    refreshToken
  };
}

