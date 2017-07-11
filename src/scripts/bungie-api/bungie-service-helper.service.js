/**
 * Helpers for interacting with Bungie APIs.
 */
export function BungieServiceHelper($rootScope, $q, $timeout, $http, $state, dimState, $translate) {
  'ngInject';

  return {
    handleErrors,
    retryOnThrottled
  };

  /**
   * Generically handle errors in a response from the Bungie APIs,
   * including HTTP status codes and Bungie API status codes.
   */
  function handleErrors(response) {
    if (response.status === -1) {
      return $q.reject(new Error($translate.instant('BungieService.NotConnected')));
    }
    // Token expired and other auth maladies
    if (response.status === 401 || response.status === 403) {
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject(new Error($translate.instant('BungieService.NotLoggedIn')));
    }
    if (response.status >= 503 && response.status <= 526 /* cloudflare */) {
      return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
    }
    if (response.status < 200 || response.status >= 400) {
      return $q.reject(new Error($translate.instant('BungieService.NetworkError', {
        status: response.status,
        statusText: response.statusText
      })));
    }

    const errorCode = response.data ? response.data.ErrorCode : -1;

    // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
    switch (errorCode) {
    case 1: // Success
      return response;
    case 22: // WebAuthModuleAsyncFailed
      // We've only seen this when B.net is down
      return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
    case 1627: // DestinyVendorNotFound
      return $q.reject(new Error($translate.instant('BungieService.VendorNotFound')));
    case 2106: // AuthorizationCodeInvalid
    case 2108: // AccessNotPermittedByApplicationScope
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject("DIM does not have permission to perform this action.");
    case 5: // SystemDisabled
      return $q.reject(new Error($translate.instant('BungieService.Maintenance')));
    case 35: // ThrottleLimitExceededMinutes
    case 36: // ThrottleLimitExceededMomentarily
    case 37: // ThrottleLimitExceededSeconds
      return $q.reject(new Error($translate.instant('BungieService.Throttled')));
    case 2111: // token expired
    case 99: // WebAuthRequired
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject(new Error($translate.instant('BungieService.NotLoggedIn')));
    case 1601: // DestinyAccountNotFound
    case 1618: // DestinyUnexpectedError
      if (response.config.url.indexOf('/Account/') >= 0 &&
          response.config.url.indexOf('/Character/') < 0) {
        const error = new Error($translate.instant('BungieService.NoAccount', { platform: dimState.active.label }));
        error.code = errorCode;
        return $q.reject(error);
      }
    case 2101: // ApiInvalidOrExpiredKey
    case 2102: // ApiKeyMissingFromRequest
    case 2107: // OriginHeaderDoesNotMatchKey
      if ($DIM_FLAVOR === 'dev') {
        $state.go('developer');
        return $q.reject(new Error($translate.instant('BungieService.DevVersion')));
      } else {
        return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
      }
    }

    // Any other error
    if (errorCode > 1) {
      if (response.data.Message) {
        const error = new Error($translate.instant('BungieService.UnknownError', { message: response.data.Message }));
        error.code = response.data.ErrorCode;
        error.status = response.data.ErrorStatus;
        return $q.reject(error);
      } else {
        return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
      }
    }

    return response;
  }

  /**
   * A response handler that can be used to retry the response if it
   * receives the specific Bungie throttling error codes.
   */
  function retryOnThrottled(response, retries = 3) {
    // TODO: these different statuses suggest different backoffs
    if (response.data &&
        // ThrottleLimitExceededMinutes
        (response.data.ErrorCode === 35 ||
         // ThrottleLimitExceededMomentarily
         response.data.ErrorCode === 36 ||
         // ThrottleLimitExceededSeconds
         response.data.ErrorCode === 37)) {
      if (retries <= 0) {
        return response;
      } else {
        return $timeout(Math.pow(2, 4 - retries) * 1000)
          .then(() => $http(response.config))
          .then((response) => retryOnThrottled(response, retries - 1));
      }
    } else {
      return response;
    }
  }
}
