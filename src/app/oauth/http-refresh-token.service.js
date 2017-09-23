/**
 * This is an interceptor for the $http service that watches for missing or expired
 * OAuth tokens and attempts to acquire them.
 */
export function HttpRefreshTokenService($rootScope, $q, $injector, OAuthService, OAuthTokenService) {
  'ngInject';

  let cache = null;
  const matcher = /www\.bungie\.net\/(D1\/)?Platform\/(User|Destiny|Destiny2)\//;

  return {
    request: requestHandler,
    response: responseHandler
  };

  function requestHandler(config) {
    config.headers = config.headers || {};

    if (config.url.match(matcher) &&
        !config.headers.hasOwnProperty('Authorization')) {
      const token = OAuthTokenService.getToken();
      if (token) {
        const accessTokenIsValid = token && isTokenValid(token.accessToken);

        if (accessTokenIsValid) {
          config.headers.Authorization = `Bearer ${token.accessToken.value}`;
        } else {
          const refreshTokenIsValid = token && isTokenValid(token.refreshToken);

          if (refreshTokenIsValid) {
            cache = cache || OAuthService.getAccessTokenFromRefreshToken(token.refreshToken);

            return cache
              .then((token) => {
                OAuthTokenService.setToken(token);

                console.log("Successfully updated auth token from refresh token.");
                config.headers.Authorization = `Bearer ${token.accessToken.value}`;
                return config;
              })
              .catch(handleRefreshTokenError)
              .finally(() => {
                cache = null;
              });
          } else {
            console.warn("Refresh token invalid, clearing auth tokens & going to login");
            OAuthTokenService.removeToken();
            $rootScope.$broadcast('dim-no-token-found');
            // TODO: throw error?
          }
        }
      } else {
        console.warn("No auth token exists, redirect to login");
        OAuthTokenService.removeToken();
        $rootScope.$broadcast('dim-no-token-found');
        // TODO: throw error?
      }
    }

    return config;
  }

  function handleRefreshTokenError(response) {
    if (response.status === -1) {
      console.warn("Error getting auth token from refresh token because there's no internet connection. Not clearing token.", response);
    } else if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.warn("Refresh token expired or not valid, clearing auth tokens & going to login", response);
      OAuthTokenService.removeToken();
      $rootScope.$broadcast('dim-no-token-found');
    } else if (response.data && response.data.ErrorCode) {
      if (response.data.ErrorCode === 2110 /* RefreshTokenNotYetValid */ ||
          response.data.ErrorCode === 2111 /* AccessTokenHasExpired */ ||
          response.data.ErrorCode === 2106 /* AuthorizationCodeInvalid */) {
        console.warn("Refresh token expired or not valid, clearing auth tokens & going to login", response);
        OAuthTokenService.removeToken();
        $rootScope.$broadcast('dim-no-token-found');
      }
    } else {
      console.warn("Other error getting auth token from refresh token. Not clearing auth tokens", response);
    }
    return $q.reject(response);
  }

  function isTokenValid(token) {
    // reject refresh tokens from the old auth process
    if (token && token.name === 'refresh' && token.readyin) {
      return false;
    }
    const expired = OAuthTokenService.hasTokenExpired(token);
    return !expired;
  }

  /**
   * A limited version of the error handler in bungie-service-helper.service.js,
   * which can detect errors related to auth (expired token, etc), refresh and retry.
   */
  function responseHandler(response) {
    console.log('responseHandler', response);
    if (response.config.url.match(matcher) &&
        !response.config.triedRefresh && // Only try once, to avoid infinite loop
        (response.status === 401 ||
         (response.data &&
          (response.data.ErrorCode === 2111 || // Auth token expired
           response.data.ErrorCode === 99 || // WebAuthRequired
           response.data.ErrorCode === 22)))) { // WebAuthModuleAsyncFailed (also means the access token has expired)
      // OK, Bungie has told us our access token is expired or
      // invalid. Refresh it and try again.
      console.log(`Access token expired (code ${response.data.ErrorCode}), refreshing`);
      const token = OAuthTokenService.getToken();
      const refreshTokenIsValid = token && isTokenValid(token.refreshToken);

      if (refreshTokenIsValid) {
        response.config.triedRefresh = true;
        cache = cache || OAuthService.getAccessTokenFromRefreshToken(token.refreshToken);
        return cache
          .then((token) => {
            OAuthTokenService.setToken(token);

            console.log("Successfully updated auth token from refresh token after failed request.");
            response.config.headers.Authorization = `Bearer ${token.accessToken.value}`;
            return $injector.get('$http')(response.config);
          })
          .catch(handleRefreshTokenError)
          .finally(() => {
            cache = null;
          });
      } else {
        console.warn("Refresh token invalid, clearing auth tokens & going to login");
        OAuthTokenService.removeToken();
        $rootScope.$broadcast('dim-no-token-found');
      }
    }

    return response;
  }
}
