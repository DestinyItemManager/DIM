import { getAccessTokenFromRefreshToken } from './oauth.service';
import {
  Tokens,
  removeToken,
  setToken,
  getToken,
  hasTokenExpired,
  removeAccessToken
} from './oauth-token.service';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { router } from '../../router';

let cache: Promise<Tokens> | null = null;

export async function fetchWithBungieOAuth(
  request: Request | string,
  options?: RequestInit,
  triedRefresh = false
): Promise<Response> {
  if (typeof request === 'string') {
    request = new Request(request);
  }

  try {
    const token = await getActiveToken();
    request.headers.set('Authorization', `Bearer ${token.accessToken.value}`);
  } catch (e) {
    // Note: instanceof doesn't work due to a babel bug:
    if (e.name === 'FatalTokenError') {
      console.warn('Unable to get auth token, clearing auth tokens & going to login: ', e);
      removeToken();
      goToLoginPage();
    }
    throw e;
  }

  // clone is us trying to work around "Body has already been consumed." in retry.
  const response = await fetch(request.clone(), options);
  if (await responseIndicatesBadToken(response)) {
    if (triedRefresh) {
      // Give up
      removeToken();
      goToLoginPage();
      throw new Error("Access token expired, and we've already tried to refresh. Failing.");
    }
    // OK, Bungie has told us our access token is expired or
    // invalid. Refresh it and try again.
    console.log(`Access token expired, removing access token and trying again`);
    removeAccessToken();
    return fetchWithBungieOAuth(request, options, true);
  }

  return response;
}

async function responseIndicatesBadToken(response: Response) {
  if (response.status === 401) {
    return true;
  }
  const data = await response.clone().json();
  return (
    data &&
    (data.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired ||
      data.ErrorCode === PlatformErrorCodes.WebAuthRequired ||
      // (also means the access token has expired)
      data.ErrorCode === PlatformErrorCodes.WebAuthModuleAsyncFailed)
  );
}

/**
 * A fatal token error means we have to log in again.
 */
class FatalTokenError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'FatalTokenError';
  }
}

async function getActiveToken(): Promise<Tokens> {
  let token = getToken();
  if (!token) {
    removeToken();
    goToLoginPage();
    throw new FatalTokenError('No auth token exists, redirect to login');
  }

  const accessTokenIsValid = token && !hasTokenExpired(token.accessToken);
  if (accessTokenIsValid) {
    return token;
  }

  // Get a new token from refresh token
  const refreshTokenIsValid = token && !hasTokenExpired(token.refreshToken);
  if (!refreshTokenIsValid) {
    removeToken();
    goToLoginPage();
    throw new FatalTokenError('Refresh token invalid, clearing auth tokens & going to login');
  }

  try {
    token = await (cache || getAccessTokenFromRefreshToken(token.refreshToken!));
    setToken(token);
    console.log('Successfully updated auth token from refresh token.');
    return token;
  } catch (e) {
    return handleRefreshTokenError(e);
  } finally {
    cache = null;
  }
}

async function handleRefreshTokenError(response: Error | Response): Promise<Tokens> {
  if (response instanceof TypeError) {
    console.warn(
      "Error getting auth token from refresh token because there's no internet connection (or a permissions issue). Not clearing token.",
      response
    );
    throw response;
  }
  if (response instanceof Error) {
    console.warn(
      'Other error getting auth token from refresh token. Not clearing auth tokens',
      response
    );
    throw response;
  }
  switch (response.status) {
    case -1:
      throw new Error(
        "Error getting auth token from refresh token because there's no internet connection. Not clearing token."
      );
    case 400:
    case 401:
    case 403: {
      throw new FatalTokenError('Refresh token expired or not valid, status ' + response.status);
    }
    default: {
      try {
        const data = await response.json();
        if (data && data.ErrorCode) {
          switch (data.ErrorCode) {
            case PlatformErrorCodes.RefreshTokenNotYetValid:
            case PlatformErrorCodes.AccessTokenHasExpired:
            case PlatformErrorCodes.AuthorizationCodeInvalid:
              throw new FatalTokenError(
                'Refresh token expired or not valid, platform error ' + data.ErrorCode
              );
          }
        }
      } catch (e) {
        throw new Error("Error response wasn't json: " + e.message);
      }
    }
  }
  throw new Error('Unknown error getting response token: ' + response);
}

export function goToLoginPage() {
  if (
    $DIM_FLAVOR === 'dev' &&
    (!localStorage.getItem('apiKey') ||
      !localStorage.getItem('oauthClientId') ||
      !localStorage.getItem('oauthClientSecret'))
  ) {
    router.stateService.go('developer');
  } else {
    router.stateService.go('login');
  }
}
