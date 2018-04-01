import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/common';
import { HttpClientConfig } from 'bungie-api-ts/http';
import { t } from 'i18next';
import { $http, $rootScope, $timeout } from 'ngimport';
import { API_KEY } from './bungie-api-utils';
import {
  IHttpResponse,
  IPromise,
  IRequestConfig,
} from 'angular';
import { getActivePlatform } from '../accounts/platform.service';

export interface DimError extends Error {
  code?: PlatformErrorCodes | string;
  status?: string;
}

export function httpAdapter(config: HttpClientConfig): Promise<any> {
  return $http(buildOptions(config))
      .then(handleErrors, handleErrors)
      .then((response) => response.data) as Promise<any>;
}

export function httpAdapterWithRetry(config: HttpClientConfig): Promise<any> {
  return $http(buildOptions(config))
      .then(handleErrors, handleErrors)
      .then(retryOnThrottled)
      .then((response) => response.data) as Promise<any>;
}

function buildOptions(config: HttpClientConfig): IRequestConfig {
  const options: IRequestConfig = {
    method: config.method,
    url: config.url,
    headers: {
      'X-API-Key': API_KEY
    },
    withCredentials: true
  };

  if (config.params) {
    options.params = config.params;
  }
  if (config.body) {
    options.data = config.body;
  }

  return options;
}

/** Generate an error with a bit more info */
export function error(message: string, errorCode: PlatformErrorCodes): DimError {
  const error: DimError = new Error(message);
  error.code = errorCode;
  return error;
}

export function handleErrors<T>(response: IHttpResponse<ServerResponse<T>>): IHttpResponse<ServerResponse<T>> {
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

  const errorCode = response.data ? response.data.ErrorCode : -1;

  // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
  switch (errorCode) {
  case PlatformErrorCodes.Success:
    return response;

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
    if (response.config.url.indexOf('/Account/') >= 0 &&
        response.config.url.indexOf('/Character/') < 0) {
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
  if (response.data && response.data.Message) {
    const e = error(t('BungieService.UnknownError', { message: response.data.Message }), errorCode);
    e.status = response.data.ErrorStatus;
    throw e;
  } else {
    console.error('No response data:', response.status, response.statusText, response.xhrStatus, (response as any).message, Object.keys(response));
    throw new Error(t('BungieService.Difficulties'));
  }
}

/**
 * A response handler that can be used to retry the response if it
 * receives the specific Bungie throttling error codes.
 */
export function retryOnThrottled<T>(response: IHttpResponse<ServerResponse<T>>, retries: number = 3): IPromise<IHttpResponse<ServerResponse<T>>> | IHttpResponse<ServerResponse<T>> {
  // TODO: these different statuses suggest different backoffs
  if (response.data &&
      (response.data.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededMinutes ||
        response.data.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededMomentarily ||
        response.data.ErrorCode === PlatformErrorCodes.ThrottleLimitExceededSeconds)) {
    if (retries <= 0) {
      return response;
    } else {
      return $timeout(Math.pow(2, 4 - retries) * 1000)
        .then(() => $http(response.config))
        .then((response: IHttpResponse<ServerResponse<T>>) => retryOnThrottled(response, retries - 1));
    }
  } else {
    return response;
  }
}
