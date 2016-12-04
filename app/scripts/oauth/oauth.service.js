(function() {
  function OAuthService($q, $injector, storage, OAuthTokenService) {
    function isAuthenticated() {
      return Boolean(OAuthTokenService.getToken());
    }

    function getToken() {
      // Gets an access token from service.
    }

    function refreshToken() {
      const $http = $injector.get('$http');

      return $http({
        method: 'POST',
        url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromRefreshToken/',
        headers: {
          'X-API-Key': storage.get('apiKey'),
        },
        data: {
          refreshToken: OAuthTokenService.getRefreshToken().value
        }
      })
      .then((response) => {
        if (response && response.data && (response.data.ErrorCode === 1) && response.data.Response && response.data.Response.accessToken) {
          const accessToken = angular.merge({}, response.data.Response.accessToken, { name: 'access', inception: (new Date()).toISOString() });
          const refreshToken = angular.merge({}, response.data.Response.refreshToken, { name: 'refresh', inception: (new Date()).toISOString() });

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

    function revokeToken() {
      // Revokes token via api
    }

    return {
      isAuthenticated,
      getToken,
      refreshToken,
      revokeToken
    };
  }

  OAuthService.$inject = ['$q', '$injector', 'localStorageService', 'OAuthTokenService']

  angular.module('dim-oauth')
    .service('OAuthService', OAuthService);
})();
