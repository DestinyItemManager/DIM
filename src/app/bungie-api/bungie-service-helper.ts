import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/common';
import { HttpClientConfig } from 'bungie-api-ts/http';
import { t } from 'i18next';
import { $rootScope } from 'ngimport';
import { API_KEY } from './bungie-api-utils';
import { getActivePlatform } from '../accounts/platform.service';
import { fetchWithBungieOAuth } from '../oauth/http-refresh-token.service';
import { rateLimitedFetch } from './rate-limiter';
import { stringify } from 'simple-query-string';

export interface DimError extends Error {
  code?: PlatformErrorCodes | string;
  status?: string;
}

const ourFetch = rateLimitedFetch(fetchWithBungieOAuth);

export function httpAdapter(config: HttpClientConfig): Promise<ServerResponse<any>> {
  return Promise.resolve(ourFetch(buildOptions(config)))
      .then(handleErrors, handleErrors);
}

export function httpAdapterWithRetry(config: HttpClientConfig): Promise<ServerResponse<any>> {
  return Promise.resolve(ourFetch(buildOptions(config)))
      .then(handleErrors, handleErrors);
}

function buildOptions(config: HttpClientConfig): Request {
  let url = config.url;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }

  console.log(config);
  return new Request(
    url,
    {
      method: config.method,
      body: JSON.stringify(config.body),
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
}

/** Generate an error with a bit more info */
export function error(message: string, errorCode: PlatformErrorCodes): DimError {
  const error: DimError = new Error(message);
  error.code = errorCode;
  return error;
}

export async function handleErrors<T>(response: Response): Promise<ServerResponse<T>> {
  if (response instanceof Error) {
    throw response;
  }

  if (response.status === -1) {
    throw new Error(navigator.onLine
      ? t('BungieService.NotConnectedOrBlocked')
      : t('BungieService.NotConnected'));
  }
  // Token expired and other auth maladies
  if (response.status === 401 || response.status === 403) {
    $rootScope.$broadcast('dim-no-token-found');
    throw new Error(t('BungieService.NotLoggedIn'));
  }
  /* 526 = cloudflare */
  if (response.status >= 503 && response.status <= 526) {
    throw new Error(t('BungieService.Difficulties'));
  }
  if (response.status < 200 || response.status >= 400) {
    throw new Error(t('BungieService.NetworkError', {
      status: response.status,
      statusText: response.statusText
    }));
  }

  console.log(response);
  const data: ServerResponse<any> = await response.json();

  const errorCode = data ? data.ErrorCode : -1;

  // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
  switch (errorCode) {
  case PlatformErrorCodes.Success:
    return data;

  case PlatformErrorCodes.DestinyVendorNotFound:
    throw error(t('BungieService.VendorNotFound'), errorCode);

  case PlatformErrorCodes.AuthorizationCodeInvalid:
  case PlatformErrorCodes.AccessNotPermittedByApplicationScope:
    $rootScope.$broadcast('dim-no-token-found');
    throw error("DIM does not have permission to perform this action.", errorCode);

  case PlatformErrorCodes.SystemDisabled:
    throw error(t('BungieService.Maintenance'), errorCode);

  case PlatformErrorCodes.ThrottleLimitExceededMinutes:
  case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
  case PlatformErrorCodes.ThrottleLimitExceededSeconds:
    throw error(t('BungieService.Throttled'), errorCode);

  case PlatformErrorCodes.AccessTokenHasExpired:
  case PlatformErrorCodes.WebAuthRequired:
  case PlatformErrorCodes.WebAuthModuleAsyncFailed: // means the access token has expired
    $rootScope.$broadcast('dim-no-token-found');
    throw error(t('BungieService.NotLoggedIn'), errorCode);

  case PlatformErrorCodes.DestinyAccountNotFound:
  case PlatformErrorCodes.DestinyUnexpectedError:
    if (response.url.indexOf('/Account/') >= 0 &&
        response.url.indexOf('/Character/') < 0) {
      const account = getActivePlatform();
      throw error(t('BungieService.NoAccount', {
        platform: account ? account.platformLabel : 'Unknown'
      }), errorCode);
    }
    break;

  case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
    throw error(t('BungieService.DestinyLegacyPlatform'), errorCode);

  case PlatformErrorCodes.ApiInvalidOrExpiredKey:
  case PlatformErrorCodes.ApiKeyMissingFromRequest:
  case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
    if ($DIM_FLAVOR === 'dev') {
      // TODO: $state.go('developer');
      throw error(t('BungieService.DevVersion'), errorCode);
    } else {
      throw error(t('BungieService.Difficulties'), errorCode);
    }
  }

  // Any other error
  if (data && data.Message) {
    const e = error(t('BungieService.UnknownError', { message: data.Message }), errorCode);
    e.status = data.ErrorStatus;
    throw e;
  } else {
    console.error('No response data:', response.status, response.statusText);
    throw new Error(t('BungieService.Difficulties'));
  }
}

/**
 * A response handler that can be used to retry the response if it
 * receives the specific Bungie throttling error codes.
 */
/*
export function retryOnThrottled<T>(response: ServerResponse<T>, retries: number = 3): Promise<ServerResponse<T>> | ServerResponse<T> {
  // TODO: these different statuses suggest different backoffs
  if (response &&
      (response.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededMinutes ||
        response.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededMomentarily ||
        response.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededSeconds)) {
    if (retries <= 0) {
      return response;
    } else {
      return Promise.new((resolve, reject) => {
        setTimeout(() => {
          ourFetch()
        }, Math.pow(2, 4 - retries) * 1000);
      });
      return $timeout(Math.pow(2, 4 - retries) * 1000)
        .then(() => $http(response.config))
        .then((response: IHttpResponse<ServerResponse<T>>) => retryOnThrottled(response, retries - 1));
    }
  } else {
    return response;
  }
}
*/
