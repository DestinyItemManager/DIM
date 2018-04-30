import { getAccessTokenFromRefreshToken } from './oauth.service';
import { Tokens, removeToken, setToken, getToken, hasTokenExpired } from './oauth-token.service';
import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/user';
import { IRequestConfig, IHttpResponse } from 'angular';
import { $rootScope } from 'ngimport';

declare module 'angular' {
  interface IRequestConfig {
    /** Track whether we've tried refreshing access tokens */
    triedRefresh?: boolean;
  }
}

let cache: Promise<Tokens> | null = null;
const matcher = /www\.bungie\.net\/(D1\/)?Platform\/(User|Destiny|Destiny2)\//;

export async function fetchWithBungieOAuth(request: Request | string, options?: RequestInit, triedRefresh = false): Promise<Response> {
  if (typeof request === "string") {
    request = new Request(request);
  }

  if (request.url.match(matcher) && !request.headers.has('Authorization')) {
    try {
      const token = await getActiveToken();
      request.headers.set('Authorization', `Bearer ${token.accessToken.value}`);
    } catch (e) {
      if (e instanceof FatalTokenError) {
        console.warn("Unable to get auth token, clearing auth tokens & going to login: ", e);
        removeToken();
        $rootScope.$broadcast('dim-no-token-found');
      }
      throw e;
    }

    return fetch(request, options).then(async(response) => {
      const data = await response.json();
      if (responseIndicatesBadToken(response, data)) {
        if (triedRefresh) {
          throw new Error("Access token expired, and we've already tried to refresh. Failing.");
        }
        // OK, Bungie has told us our access token is expired or
        // invalid. Refresh it and try again.
        console.log(`Access token expired (code ${data.ErrorCode}), removing tokens and trying again`);
        removeToken();
        return fetchWithBungieOAuth(request, options, true);
      }

      return response;
    });
  }

  return fetch(request, options);
}

function responseIndicatesBadToken(response: Response | IHttpResponse<any>, data: ServerResponse<any>) {
  return response.status === 401 ||
    (data &&
      (data.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired ||
      data.ErrorCode === PlatformErrorCodes.WebAuthRequired ||
      // (also means the access token has expired)
      data.ErrorCode === PlatformErrorCodes.WebAuthModuleAsyncFailed));
}

/**
 * This is an interceptor for the $http service that watches for missing or expired
 * OAuth tokens and attempts to acquire them.
 */
export function HttpRefreshTokenService($rootScope, $injector) {
  'ngInject';

  return {
    request: requestHandler,
    response: responseHandler
  };

  async function requestHandler(request: IRequestConfig) {
    request.headers = request.headers || {};

    if (request.url.match(matcher) && !request.headers.hasOwnPropetry('Authorization')) {
      try {
        const token = await getActiveToken();
        request.headers!.Authorization = `Bearer ${token.accessToken.value}`;
      } catch (e) {
        if (e instanceof FatalTokenError) {
          console.warn("Unable to get auth token, clearing auth tokens & going to login: ", e);
          removeToken();
          $rootScope.$broadcast('dim-no-token-found');
        }
        throw e;
      }
    }

    return request;
  }

  /**
   * A limited version of the error handler in bungie-service-helper.service.js,
   * which can detect errors related to auth (expired token, etc), refresh and retry.
   */
  function responseHandler(response: IHttpResponse<any>) {
    if (response.config.url.match(matcher) &&
        responseIndicatesBadToken(response, response.data)) {
      // Only try once, to avoid infinite loop
      if (response.config.triedRefresh) {
        throw new Error("Access token expired, and we've already tried to refresh. Failing.");
      }
      // OK, Bungie has told us our access token is expired or
      // invalid. Refresh it and try again.
      console.log(`Access token expired (code ${response.data.ErrorCode}), removing tokens and trying again`);
      removeToken();
      response.config.triedRefresh = true;
      return $injector.get('$http')(response.config);
    }

    return response;
  }
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
 * A fatal token error means we have to log in again.
 */
class FatalTokenError extends Error {}

async function getActiveToken(): Promise<Tokens> {
  let token = getToken();
  if (!token) {
    removeToken();
    $rootScope.$broadcast('dim-no-token-found');
    throw new FatalTokenError("No auth token exists, redirect to login");
  }

  const accessTokenIsValid = token && isTokenValid(token.accessToken);
  if (accessTokenIsValid) {
    return token;
  }

  // Get a new token from refresh token
  const refreshTokenIsValid = token && isTokenValid(token.refreshToken);
  if (!refreshTokenIsValid) {
    removeToken();
    $rootScope.$broadcast('dim-no-token-found');
    throw new FatalTokenError("Refresh token invalid, clearing auth tokens & going to login");
  }

  try {
    token = await (cache || getAccessTokenFromRefreshToken(token.refreshToken!));
    setToken(token);
    console.log("Successfully updated auth token from refresh token.");
    return token;
  } catch (e) {
    return handleRefreshTokenError(e);
  } finally {
    cache = null;
  }
}

async function handleRefreshTokenError(response: Error | Response): Promise<Tokens> {
  if (response instanceof TypeError) {
    console.warn("Error getting auth token from refresh token because there's no internet connection (or a permissions issue). Not clearing token.", response);
    throw response;
  }
  if (response instanceof Error) {
    console.warn("Other error getting auth token from refresh token. Not clearing auth tokens", response);
    throw response;
  }
  switch (response.status) {
    case -1:
      throw new Error("Error getting auth token from refresh token because there's no internet connection. Not clearing token.");
    case 400:
    case 401:
    case 403: {
      throw new FatalTokenError("Refresh token expired or not valid");
    }
    default: {
      try {
        const data = await response.json();
        if (data && data.ErrorCode) {
          switch (data.ErrorCode) {
            case PlatformErrorCodes.RefreshTokenNotYetValid:
            case PlatformErrorCodes.AccessTokenHasExpired:
            case PlatformErrorCodes.AuthorizationCodeInvalid:
              throw new FatalTokenError("Refresh token expired or not valid");
          }
        }
      } catch (e) {
        throw new Error("Error response wasn't json: " + response);
      }
    }
  }
  throw new Error("Unknown error getting response token: " + response);
}
