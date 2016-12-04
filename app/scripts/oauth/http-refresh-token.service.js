(function() {
  function HttpRefreshTokenService($rootScope, $q, $injector, storage, OAuthService, OAuthTokenService) {
    const service = this;
    let cache = null;
    const limiters = [/www\.bungie.net\/Platform\/User\/*/, /www\.bungie.net\/Platform\/Destiny\/*/];

    service.request = requestHandler;
    service.response = responseHandler;

    function requestHandler(config) {
      config.headers = config.headers || {};

      const matched = limiters.findIndex((limiter) => {
        return config.url.match(limiter);
      });

      if (matched >= 0) {
        if (!config.headers.hasOwnProperty('Authorization')) {
          if (OAuthService.isAuthenticated) {
            let isValid = isTokenValid(OAuthTokenService.getAccessToken());

            if (isValid) {
              config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();
            } else {
              isValid = isTokenValid(OAuthTokenService.getRefreshToken());

              if (isValid) {
                if (!cache) {
                  // var $http = $injector.get('$http');
                  debugger;
                  cache = OAuthService.refreshToken();
                }

                return cache.then(function(response) {
                  config.headers.Authorization = 'Bearer ' + response.accessToken.value;

                  return config;
                })
                .catch((error) => {
                  OAuthTokenService.removeToken();
                  $rootScope.$broadcast('dim-no-token-found');
                });
              } else {
                OAuthTokenService.removeToken();
                $rootScope.$broadcast('dim-no-token-found');
              }
            }
          } else {
            OAuthTokenService.removeToken();
            $rootScope.$broadcast('dim-no-token-found');
          }
        }

        //  && OAuthTokenService.getAuthorizationHeader()) {
        //   config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();
        // }
      }

      return config;
    }

    function isTokenValid(token) {
      const expired = OAuthTokenService.hasTokenExpired(token);
      const isReady = OAuthTokenService.isTokenReady(token);

      return (!expired && isReady);
    }

    function responseHandler(response) {
      const matched = limiters.findIndex((limiter) => {
        return response.config.url.match(limiter);
      });

      if ((matched >= 0) && response && response.data) {
        switch (response.data.ErrorCode) {
        case 99:
          {
            if (OAuthTokenService.hasTokenExpired(OAuthTokenService.getAccessToken())) {

            }
            // if (canRefreshAuthorization(response)) {
            //   return refreshAuthorization(response);
            // } else {
            //   // Generate access token
            // }
            break;
          }
        }
      }

      return $q.when(response);
    }

    function canRefreshAuthorization(response) {
      const responseHasAuthorization = response.config && response.config.headers && response.config.headers.Authorization;

      return responseHasAuthorization;
    }

    function replayRequest(config) {
      const $http = $injector.get('$http');

      return $http(config);
    }

    function refreshAuthorization(response) {
          // response.config.headers.Authorization = 'Bearer ' + authorization.accessToken.value;
          // return $injector.get('$http')(response.config);
    }
  }

  HttpRefreshTokenService.$inject = ['$rootScope', '$q', '$injector', 'localStorageService', 'OAuthService', 'OAuthTokenService'];

  angular.module('dim-oauth').service('http-refresh-token', HttpRefreshTokenService);
})();
