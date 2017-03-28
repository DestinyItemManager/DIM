import angular from 'angular';

angular.module('dim-oauth')
  .service('http-refresh-token', HttpRefreshTokenService);

function HttpRefreshTokenService($rootScope, $q, $injector, OAuthService, OAuthTokenService) {
  'ngInject';

  const service = this;
  let cache = null;
  const matcher = /www\.bungie.net\/Platform\/(User|Destiny)\//;

  service.request = requestHandler;
  service.response = responseHandler;

  function requestHandler(config) {
    config.headers = config.headers || {};

    if (config.url.match(matcher)) {
      if (!config.headers.hasOwnProperty('Authorization')) {
        if (OAuthService.isAuthenticated()) {
          let isValid = isTokenValid(OAuthTokenService.getAccessToken());

          if (isValid) {
            config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();
          } else {
            isValid = isTokenValid(OAuthTokenService.getRefreshToken());

            if (isValid) {
              if (!cache) {
                cache = OAuthService.refreshToken();
              }

              return cache.then(function() {
                config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();

                return config;
              })
              .catch(() => {
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
    if (response && response.config.url.match(matcher) && response.data) {
      switch (response.data.ErrorCode) {
      case 99:
        {
          if (OAuthTokenService.hasTokenExpired(OAuthTokenService.getAccessToken())) {
            $rootScope.$broadcast('dim-no-token-found');
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

//    function canRefreshAuthorization(response) {
//      const responseHasAuthorization = response.config && response.config.headers && response.config.headers.Authorization;
//
//      return responseHasAuthorization;
//    }
//
//    function replayRequest(config) {
//      const $http = $injector.get('$http');
//
//      return $http(config);
//    }
//
//    function refreshAuthorization(response) {
//          // response.config.headers.Authorization = 'Bearer ' + authorization.accessToken.value;
//          // return $injector.get('$http')(response.config);
//    }
}
