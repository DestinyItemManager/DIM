import { t } from 'app/i18next-t';
import { infoLog, warnLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { HttpStatusError } from './http-client';
import { getAccessTokenFromRefreshToken } from './oauth';
import { Tokens, getToken, hasTokenExpired, removeAccessToken } from './oauth-tokens';

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
  request: RequestInfo | URL,
  options?: RequestInit,
  triedRefresh = false,
): Promise<Response> {
  if (!(request instanceof Request)) {
    request = new Request(request);
  }

  try {
    const token = await getActiveToken();
    request.headers.set('Authorization', `Bearer ${token.accessToken.value}`);
  } catch (e) {
    if (e instanceof FatalTokenError) {
      warnLog('bungie auth', 'Unable to get auth token', e);
    }
    throw e;
  }

  // clone is us trying to work around "Body has already been consumed." in retry.
  const response = await fetch(request.clone(), options);
  if (await responseIndicatesBadToken(response)) {
    if (triedRefresh) {
      // Give up
      throw new FatalTokenError(
        "Access token expired, and we've already tried to refresh. Failing.",
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
  if (response.status === 401) {
    return true;
  }
  try {
    const data = (await response.clone().json()) as { ErrorCode: PlatformErrorCodes } | undefined;
    return Boolean(
      data &&
      (data.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired ||
        data.ErrorCode === PlatformErrorCodes.WebAuthRequired ||
        // (also means the access token has expired)
        data.ErrorCode === PlatformErrorCodes.WebAuthModuleAsyncFailed ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationRecordRevoked ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationRecordExpired ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationCodeStale ||
        data.ErrorCode === PlatformErrorCodes.AuthorizationCodeInvalid),
    );
  } catch {}
  return false;
}

export async function getActiveToken(): Promise<Tokens> {
  const token = getToken();
  if (!token) {
    throw new FatalTokenError('No auth token exists, redirect to login');
  }

  const accessTokenIsValid = token && !hasTokenExpired(token.accessToken);
  if (accessTokenIsValid) {
    return token;
  }

  // Get a new token from refresh token
  const refreshTokenIsValid = token && !hasTokenExpired(token.refreshToken);
  if (!refreshTokenIsValid) {
    throw new FatalTokenError('Refresh token invalid, clearing auth tokens & going to login');
  }

  try {
    return await getAccessTokenFromRefreshToken(token.refreshToken!);
  } catch (e) {
    return handleRefreshTokenError(e);
  }
}

function handleRefreshTokenError(error: unknown): Promise<Tokens> {
  if (error instanceof TypeError) {
    warnLog(
      'bungie auth',
      "Error getting auth token from refresh token because there's no internet connection (or a permissions issue). Not clearing token.",
      error,
    );
    throw error;
  }
  if (!(error instanceof HttpStatusError)) {
    warnLog(
      'bungie auth',
      'Other error getting auth token from refresh token. Not clearing auth tokens',
      error,
    );
    throw error;
  }
  let data;
  if (error.responseBody) {
    try {
      data = JSON.parse(error.responseBody) as {
        error?: string;
        error_description?: string;
        ErrorCode?: PlatformErrorCodes;
      };
    } catch {}
  }

  if (data) {
    if (data.error === 'server_error') {
      switch (data.error_description) {
        case 'SystemDisabled':
          throw new Error(t('BungieService.Maintenance'));
        case 'RefreshTokenNotYetValid':
        case 'AccessTokenHasExpired':
        case 'AuthorizationCodeInvalid':
        case 'AuthorizationRecordExpired':
        case 'AuthorizationRecordRevoked':
        case 'AuthorizationCodeStale':
          throw new FatalTokenError(
            `Refresh token expired or not valid, platform error ${data.error_description}`,
          );
        default:
          throw new Error(
            `Unknown error getting response token: ${data.error}, ${data.error_description}`,
          );
      }
    }

    if (data.ErrorCode) {
      switch (data.ErrorCode) {
        case PlatformErrorCodes.RefreshTokenNotYetValid:
        case PlatformErrorCodes.AccessTokenHasExpired:
        case PlatformErrorCodes.AuthorizationCodeInvalid:
        case PlatformErrorCodes.AuthorizationRecordExpired:
        case PlatformErrorCodes.AuthorizationRecordRevoked:
        case PlatformErrorCodes.AuthorizationCodeStale:
          throw new FatalTokenError(
            `Refresh token expired or not valid, platform error ${data.ErrorCode}`,
          );
        default:
          break;
      }
    }
  }

  switch (error.status) {
    case -1:
      throw new Error(
        "Error getting auth token from refresh token because there's no internet connection. Not clearing token.",
      );
    case 401:
    case 403: {
      throw new FatalTokenError(`Refresh token expired or not valid, status ${error.status}`);
    }
  }

  throw new Error(
    `Unknown error getting response token. status: ${error.status}, response: ${
      error.responseBody ?? 'No response body'
    }`,
  );
}
