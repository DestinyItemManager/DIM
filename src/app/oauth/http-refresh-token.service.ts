import { getAccessTokenFromRefreshToken } from './oauth.service';
import { Tokens, removeToken, setToken, getToken, hasTokenExpired } from './oauth-token.service';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { IRequestConfig, IHttpResponse } from 'angular';

declare module 'angular' {
  interface IRequestConfig {
    /** Track whether we've tried refreshing access tokens */
    triedRefresh?: boolean;
  }
}

/**
 * This is an interceptor for the $http service that watches for missing or expired
 * OAuth tokens and attempts to acquire them.
 */
export function HttpRefreshTokenService($rootScope, $injector) {
  'ngInject';

  let cache: Promise<Tokens> | null = null;
  const matcher = /www\.bungie\.net\/(D1\/)?Platform\/(User|Destiny|Destiny2)\//;

  return {
    request: requestHandler,
    response: responseHandler
  };

  function requestHandler(config: IRequestConfig) {
    config.headers = config.headers || {};

    if (config.url.match(matcher) &&
        !config.headers.hasOwnProperty('Authorization')) {
      const token = getToken();
      if (token) {
        const accessTokenIsValid = token && isTokenValid(token.accessToken);

        if (accessTokenIsValid) {
          config.headers.Authorization = `Bearer ${token.accessToken.value}`;
        } else {
          const refreshTokenIsValid = token && isTokenValid(token.refreshToken);

          if (refreshTokenIsValid) {
            cache = cache || getAccessTokenFromRefreshToken(token.refreshToken);

            return cache
              .then((token) => {
                setToken(token);

                console.log("Successfully updated auth token from refresh token.");
                config.headers!.Authorization = `Bearer ${token.accessToken.value}`;
                return config;
              })
              .catch(handleRefreshTokenError)
              .finally(() => {
                cache = null;
              });
          } else {
            console.warn("Refresh token invalid, clearing auth tokens & going to login");
            removeToken();
            $rootScope.$broadcast('dim-no-token-found');
            // TODO: throw error?
          }
        }
      } else {
        console.warn("No auth token exists, redirect to login");
        removeToken();
        $rootScope.$broadcast('dim-no-token-found');
        // TODO: throw error?
      }
    }

    return config;
  }

  function handleRefreshTokenError(response: IHttpResponse<any>) {
    if (response.status === -1) {
      console.warn("Error getting auth token from refresh token because there's no internet connection. Not clearing token.", response);
    } else if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.warn("Refresh token expired or not valid, clearing auth tokens & going to login", response);
      removeToken();
      $rootScope.$broadcast('dim-no-token-found');
    } else if (response.data && response.data.ErrorCode) {
      switch (response.data.ErrorCode) {
        case PlatformErrorCodes.RefreshTokenNotYetValid:
        case PlatformErrorCodes.AccessTokenHasExpired:
        case PlatformErrorCodes.AuthorizationCodeInvalid:
          console.warn("Refresh token expired or not valid, clearing auth tokens & going to login", response);
          removeToken();
          $rootScope.$broadcast('dim-no-token-found');
          break;
      }
    } else {
      console.warn("Other error getting auth token from refresh token. Not clearing auth tokens", response);
    }
    throw response;
  }

  function isTokenValid(token) {
    // reject refresh tokens from the old auth process
    if (token && token.name === 'refresh' && token.readyin) {
      return false;
    }
    const expired = hasTokenExpired(token);
    return !expired;
  }

  /**
   * A limited version of the error handler in bungie-service-helper.service.js,
   * which can detect errors related to auth (expired token, etc), refresh and retry.
   */
  function responseHandler(response: IHttpResponse<any>) {
    if (response.config.url.match(matcher) &&
        !response.config.triedRefresh && // Only try once, to avoid infinite loop
        (response.status === 401 ||
         (response.data &&
          (response.data.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired ||
           response.data.ErrorCode === PlatformErrorCodes.WebAuthRequired ||
           response.data.ErrorCode === PlatformErrorCodes.WebAuthModuleAsyncFailed)))) { // (also means the access token has expired)
      // OK, Bungie has told us our access token is expired or
      // invalid. Refresh it and try again.
      console.log(`Access token expired (code ${response.data.ErrorCode}), refreshing`);
      const token = getToken();
      const refreshTokenIsValid = token && isTokenValid(token.refreshToken);

      if (refreshTokenIsValid) {
        response.config.triedRefresh = true;
        cache = cache || getAccessTokenFromRefreshToken(token.refreshToken);
        return cache
          .then((token) => {
            setToken(token);

            console.log("Successfully updated auth token from refresh token after failed request.");
            response.config.headers!.Authorization = `Bearer ${token.accessToken.value}`;
            return $injector.get('$http')(response.config);
          })
          .catch(handleRefreshTokenError)
          .finally(() => {
            cache = null;
          });
      } else {
        console.warn("Refresh token invalid, clearing auth tokens & going to login");
        removeToken();
        $rootScope.$broadcast('dim-no-token-found');
      }
    }

    return response;
  }
}
