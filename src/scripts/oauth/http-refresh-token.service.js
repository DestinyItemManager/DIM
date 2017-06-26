/**
 * This is an interceptor for the $http service that watches for missing or expired
 * OAuth tokens and attempts to acquire them.
 */
export function HttpRefreshTokenService($rootScope, $q, $injector, OAuthService, OAuthTokenService) {
  'ngInject';

  let cache = null;
  const matcher = /www\.bungie\.net\/(D1\/)?Platform\/(User|Destiny)\//;

  return {
    request: requestHandler
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
    } else if (response.status === 401 || response.status === 403) {
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
    // TODO: private oauth apps don't have refresh tokens!
    // reject refresh tokens from the old auth process
    if (token && token.name === 'refresh' && token.readyin) {
      return false;
    }
    const expired = OAuthTokenService.hasTokenExpired(token);
    return !expired;
  }
}
