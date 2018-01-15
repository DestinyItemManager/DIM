import { StateService } from '@uirouter/angularjs';
import {
  IHttpResponse,
  IHttpService,
  IPromise,
  IRequestConfig,
  IRootScopeService,
  ITimeoutService
  } from 'angular';
import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/common';
import { HttpClientConfig } from 'bungie-api-ts/http';
import { apiKey } from './bungie-api-utils';

declare module "angular" {
  interface IPromise<T> {
    readonly [Symbol.toStringTag]: "Promise";
  }
}

export interface DimError extends Error {
  code?: PlatformErrorCodes;
  status?: string;
}

export interface BungieServiceHelperType {
  /**
   * Generically handle errors in a response from the Bungie APIs,
   * including HTTP status codes and Bungie API status codes. Either
   * returns the response as is, or throws an error.
   */
  handleErrors<T>(response: IHttpResponse<ServerResponse<T>>): IHttpResponse<ServerResponse<T>>;
  retryOnThrottled<T>(response: IHttpResponse<ServerResponse<T>>, retries: number): IPromise<IHttpResponse<ServerResponse<T>>> | IHttpResponse<ServerResponse<T>>;
  httpAdapter(config: HttpClientConfig): IPromise<any>;
  httpAdapterWithRetry(config: HttpClientConfig): IPromise<any>;
}

/**
 * Helpers for interacting with Bungie APIs.
 */
export function BungieServiceHelper(
  $rootScope: IRootScopeService,
  $timeout: ITimeoutService,
  $http: IHttpService,
  $state: StateService,
  dimState,
  $i18next
): BungieServiceHelperType {
  'ngInject';

  return {
    handleErrors,
    retryOnThrottled,
    httpAdapter,
    httpAdapterWithRetry
  };

  function buildOptions(config: HttpClientConfig): IRequestConfig {
    const options: IRequestConfig = {
      method: config.method,
      url: config.url,
      headers: {
        'X-API-Key': apiKey
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

  function httpAdapter(config: HttpClientConfig): IPromise<any> {
    return $http(buildOptions(config))
        .then(handleErrors, handleErrors)
        .then((response) => response.data);
  }

  function httpAdapterWithRetry(config: HttpClientConfig): IPromise<any> {
    return $http(buildOptions(config))
        .then(handleErrors, handleErrors)
        .then(retryOnThrottled)
        .then((response) => response.data);
  }

  function handleErrors<T>(response: IHttpResponse<ServerResponse<T>>): IHttpResponse<ServerResponse<T>> {
    if (response.status === -1) {
      throw new Error($i18next.t('BungieService.NotConnected'));
    }
    // Token expired and other auth maladies
    if (response.status === 401 || response.status === 403) {
      $rootScope.$broadcast('dim-no-token-found');
      throw new Error($i18next.t('BungieService.NotLoggedIn'));
    }
     /* 526 = cloudflare */
    if (response.status >= 503 && response.status <= 526) {
      throw new Error($i18next.t('BungieService.Difficulties'));
    }
    if (response.status < 200 || response.status >= 400) {
      throw new Error($i18next.t('BungieService.NetworkError', {
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
      throw new Error($i18next.t('BungieService.VendorNotFound'));

    case PlatformErrorCodes.AuthorizationCodeInvalid:
    case PlatformErrorCodes.AccessNotPermittedByApplicationScope:
      $rootScope.$broadcast('dim-no-token-found');
      throw new Error("DIM does not have permission to perform this action.");

    case PlatformErrorCodes.SystemDisabled:
      throw new Error($i18next.t('BungieService.Maintenance'));

    case PlatformErrorCodes.ThrottleLimitExceededMinutes:
    case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
    case PlatformErrorCodes.ThrottleLimitExceededSeconds:
      throw new Error($i18next.t('BungieService.Throttled'));

    case PlatformErrorCodes.AccessTokenHasExpired:
    case PlatformErrorCodes.WebAuthRequired:
    case PlatformErrorCodes.WebAuthModuleAsyncFailed: // means the access token has expired
      $rootScope.$broadcast('dim-no-token-found');
      throw new Error($i18next.t('BungieService.NotLoggedIn'));

    case PlatformErrorCodes.DestinyAccountNotFound:
    case PlatformErrorCodes.DestinyUnexpectedError:
      if (response.config.url.indexOf('/Account/') >= 0 &&
          response.config.url.indexOf('/Character/') < 0) {
        const error: DimError = new Error($i18next.t('BungieService.NoAccount', { platform: dimState.active.platformLabel }));
        error.code = errorCode;
        throw error;
      }
      break;

    case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
      throw new Error($i18next.t('BungieService.DestinyLegacyPlatform'));

    case PlatformErrorCodes.ApiInvalidOrExpiredKey:
    case PlatformErrorCodes.ApiKeyMissingFromRequest:
    case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
      if ($DIM_FLAVOR === 'dev') {
        $state.go('developer');
        throw new Error($i18next.t('BungieService.DevVersion'));
      } else {
        throw new Error($i18next.t('BungieService.Difficulties'));
      }
    }

    // Any other error
    if (errorCode > 1) {
      if (response.data.Message) {
        const error: DimError = new Error($i18next.t('BungieService.UnknownError', { message: response.data.Message }));
        error.code = response.data.ErrorCode;
        error.status = response.data.ErrorStatus;
        throw error;
      } else {
        throw new Error($i18next.t('BungieService.Difficulties'));
      }
    }

    return response;
  }

  /**
   * A response handler that can be used to retry the response if it
   * receives the specific Bungie throttling error codes.
   */
  function retryOnThrottled<T>(response: IHttpResponse<ServerResponse<T>>, retries: number = 3): IPromise<IHttpResponse<ServerResponse<T>>> | IHttpResponse<ServerResponse<T>> {
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
}
