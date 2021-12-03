import { t } from 'app/i18next-t';
import { infoLog, warnLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { getAccessTokenFromRefreshToken } from './oauth';
import { getToken, hasTokenExpired, removeAccessToken, removeToken, Tokens } from './oauth-tokens';

/**
 * A fatal token error means we have to log in again.
 */
export class FatalTokenError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'FatalTokenError';
  }
}

/**
 * A wrapper around "fetch" that implements Bungie's OAuth scheme. This either
 * includes a cached token, refreshes a token then includes the refreshed token,
 * or bounces us back to login.
 */
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
      warnLog(
        'bungie auth',
        'Unable to get auth token, clearing auth tokens & going to login: ',
        e
      );
      removeToken();
    }
    throw e;
  }

  // clone is us trying to work around "Body has already been consumed." in retry.
  const response = await fetch(request.clone(), options);
  if (await responseIndicatesBadToken(response)) {
    if (triedRefresh) {
      // Give up
      removeToken();
      throw new FatalTokenError(
        "Access token expired, and we've already tried to refresh. Failing."
      );
    }
    // OK, Bungie has told us our access token is expired or
    // invalid. Refresh it and try again.
    infoLog('bungie auth', 'Access token expired, removing access token and trying again');
    removeAccessToken();
    return fetchWithBungieOAuth(request, options, true);
  }

  return response;
}

async function responseIndicatesBadToken(response: Response) {
  // https://github.com/Bungie-net/api/issues/1151: D1 endpoints have a bug where they can return 401 if you've logged in via Stadia.
  // This hack prevents a login loop
  if (/\/D1\/Platform\/Destiny\/\d+\/Account\/\d+\/$/.test(response.url)) {
    return false;
  }

  if (response.status === 401) {
    return true;
  }
  try {
    const data = await response.clone().json();
    return (
      data &&
      (data.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired ||
        data.ErrorCode === PlatformErrorCodes.WebAuthRequired ||
        // (also means the access token has expired)
        data.ErrorCode === PlatformErrorCodes.WebAuthModuleAsyncFailed ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationRecordRevoked ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationRecordExpired ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationCodeStale ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationCodeInvalid)
    );
  } catch {}
  return false;
}

export async function getActiveToken(): Promise<Tokens> {
  const token = getToken();
  if (!token) {
    removeToken();
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
    throw new FatalTokenError('Refresh token invalid, clearing auth tokens & going to login');
  }

  try {
    return await getAccessTokenFromRefreshToken(token.refreshToken!);
  } catch (e) {
    return await handleRefreshTokenError(e);
  }
}

async function handleRefreshTokenError(response: Error | Response): Promise<Tokens> {
  if (response instanceof TypeError) {
    warnLog(
      'bungie auth',
      "Error getting auth token from refresh token because there's no internet connection (or a permissions issue). Not clearing token.",
      response
    );
    throw response;
  }
  if (response instanceof Error) {
    warnLog(
      'bungie auth',
      'Other error getting auth token from refresh token. Not clearing auth tokens',
      response
    );
    throw response;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {}

  if (data) {
    if (data.error === 'server_error') {
      if (data.error_description === 'SystemDisabled') {
        throw new Error(t('BungieService.Maintenance'));
      } else if (data.error_description !== 'AuthorizationRecordExpired') {
        throw new Error(
          `Unknown error getting response token: ${data.error}, ${data.error_description}`
        );
      }
    }

    if (data.ErrorCode) {
      switch (data.ErrorCode) {
        case PlatformErrorCodes.RefreshTokenNotYetValid:
        case PlatformErrorCodes.AccessTokenHasExpired:
        case PlatformErrorCodes.AuthorizationCodeInvalid:
        case PlatformErrorCodes.AuthorizationRecordExpired:
          throw new FatalTokenError(
            'Refresh token expired or not valid, platform error ' + data.ErrorCode
          );
      }
    }
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
  }

  throw new Error('Unknown error getting response token: ' + JSON.stringify(response));
}
