import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { DimError } from 'app/utils/dim-error';
import { errorLog, infoLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { HttpClient, HttpClientConfig } from 'bungie-api-ts/http';
import { throttle } from 'es-toolkit';
import { DimItem } from '../inventory/item-types';
import { FatalTokenError, fetchWithBungieOAuth } from './authenticated-fetch';
import { API_KEY } from './bungie-api-utils';
import {
  BungieError,
  HttpStatusError,
  createFetchWithNonStoppingTimeout,
  createHttpClient,
  responsivelyThrottleHttpClient,
} from './http-client';
import { rateLimitedFetch } from './rate-limiter';

const TIMEOUT = 15000;
const notifyTimeout = throttle(
  (startTime: number, timeout: number) => {
    // Only notify if the timeout fired around the right time - this guards against someone pausing
    // the tab and coming back in an hour, for example
    if (navigator.onLine && Math.abs(Date.now() - (startTime + timeout)) <= 1000) {
      showNotification({
        type: 'warning',
        title: t('BungieService.Slow'),
        body: t('BungieService.SlowDetails'),
        duration: 15000,
      });
    }
  },
  5 * 60 * 1000, // 5 minutes
  { edges: ['leading'] },
);

const logThrottle = (timesThrottled: number, waitTime: number, url: string) =>
  infoLog(
    'bungie api',
    'Throttled',
    timesThrottled,
    'times, waiting',
    waitTime,
    'ms before calling',
    url,
  );

// it would be really great if they implemented the pipeline operator soon
/** used for most Bungie API requests */
export const authenticatedHttpClient = dimErrorHandledHttpClient(
  responsivelyThrottleHttpClient(
    createHttpClient(
      rateLimitedFetch(
        createFetchWithNonStoppingTimeout(fetchWithBungieOAuth, TIMEOUT, notifyTimeout),
      ),
      API_KEY,
    ),
    logThrottle,
  ),
);

/** used to get manifest and global alerts */
export const unauthenticatedHttpClient = dimErrorHandledHttpClient(
  responsivelyThrottleHttpClient(
    createHttpClient(createFetchWithNonStoppingTimeout(fetch, TIMEOUT, notifyTimeout), API_KEY),
    logThrottle,
  ),
);

/**
 * wrap HttpClient in handling specific to DIM, using i18n strings, bounce to login, etc
 */
function dimErrorHandledHttpClient(httpClient: HttpClient): HttpClient {
  return async (config: HttpClientConfig) => {
    try {
      return await httpClient(config);
    } catch (e) {
      handleErrors(e);
    }
  };
}

/**
 * if HttpClient throws an error (js, Bungie, http) this enriches it with DIM concepts and then re-throws it
 */
export function handleErrors(error: unknown): never {
  if (error instanceof DOMException && error.name === 'AbortError') {
    throw (
      navigator.onLine
        ? new DimError('BungieService.SlowResponse')
        : new DimError('BungieService.NotConnected')
    ).withError(error);
  }

  if (error instanceof SyntaxError) {
    errorLog('bungie api', 'Error parsing Bungie.net response', error);
    throw new DimError('BungieService.Difficulties').withError(error);
  }

  if (error instanceof TypeError) {
    // fetch throws this when the user is offline (and a number of other more static cases)
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions
    throw (
      navigator.onLine
        ? new DimError('BungieService.NotConnectedOrBlocked')
        : new DimError('BungieService.NotConnected')
    ).withError(error);
  }

  if (error instanceof FatalTokenError) {
    throw new DimError('BungieService.NotLoggedIn').withError(error);
  }

  if (error instanceof HttpStatusError) {
    // Token expired and other auth maladies
    if (error.status === 401 || error.status === 403) {
      throw new DimError('BungieService.NotLoggedIn').withError(error);
    }

    // 526 = cloudflare
    // We don't catch 500s because the Bungie.net API started returning 500 for legitimate game conditions
    if (error.status >= 502 && error.status <= 526) {
      throw new DimError('BungieService.Difficulties').withError(error);
    }

    // if no specific other http error
    throw new DimError(
      'BungieService.NetworkError',
      t('BungieService.NetworkError', {
        status: error.status,
        statusText: error.message,
      }),
    ).withError(error);
  }

  // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
  if (error instanceof BungieError) {
    switch (error.code ?? -1) {
      case PlatformErrorCodes.DestinyVendorNotFound:
        throw new DimError('BungieService.VendorNotFound').withError(error);

      case PlatformErrorCodes.AuthorizationCodeInvalid:
      case PlatformErrorCodes.AccessNotPermittedByApplicationScope:
        throw new DimError('BungieService.AppNotPermitted').withError(error);

      case PlatformErrorCodes.SystemDisabled:
        throw new DimError('BungieService.Maintenance').withError(error);

      case PlatformErrorCodes.ThrottleLimitExceededMinutes:
      case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
      case PlatformErrorCodes.ThrottleLimitExceededSeconds:
      case PlatformErrorCodes.PerApplicationThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAnonymousThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAuthenticatedThrottleExceeded:
      case PlatformErrorCodes.PerUserThrottleExceeded:
        throw new DimError('BungieService.Throttled').withError(error);

      case PlatformErrorCodes.DestinyThrottledByGameServer:
        throw new DimError('BungieService.Difficulties').withError(error);

      case PlatformErrorCodes.AccessTokenHasExpired:
      case PlatformErrorCodes.WebAuthRequired:
      case PlatformErrorCodes.WebAuthModuleAsyncFailed: // means the access token has expired
        throw new DimError('BungieService.NotLoggedIn').withError(error);

      case PlatformErrorCodes.DestinyAccountNotFound:
        if (error.endpoint.includes('/Account/') && !error.endpoint.includes('/Character/')) {
          throw new DimError('BungieService.NoAccount').withError(error);
        } else {
          throw new DimError('BungieService.Difficulties').withError(error);
        }

      case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
        throw new DimError('BungieService.DestinyLegacyPlatform').withError(error);

      // These just need a custom error message because people ask questions all the time
      case PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation:
        throw new DimError('BungieService.DestinyCannotPerformActionAtThisLocation').withError(
          error,
        );
      case PlatformErrorCodes.DestinyItemUnequippable:
        throw new DimError('BungieService.DestinyItemUnequippable').withError(error);

      case PlatformErrorCodes.ApiInvalidOrExpiredKey:
      case PlatformErrorCodes.ApiKeyMissingFromRequest:
      case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
        if ($DIM_FLAVOR === 'dev') {
          throw new DimError('BungieService.DevVersion').withError(error);
        } else {
          throw new DimError('BungieService.Difficulties').withError(error);
        }

      case PlatformErrorCodes.DestinyUnexpectedError:
        throw new DimError('BungieService.Difficulties').withError(error);
      default: {
        throw new DimError(
          'BungieService.UnknownError',
          t('BungieService.UnknownError', { message: error.message }),
        ).withError(error);
      }
    }
  }

  // Any other error
  errorLog('bungie api', 'No response data:', error);
  throw new DimError('BungieService.Difficulties').withError(error);
}

// Handle "DestinyUniquenessViolation" (1648)
export function handleUniquenessViolation(error: unknown, item: DimItem): never {
  if (
    error instanceof BungieError &&
    error.code === PlatformErrorCodes.DestinyUniquenessViolation
  ) {
    throw new DimError(
      'BungieService.ItemUniquenessExplanation',
      t('BungieService.ItemUniquenessExplanation', {
        name: item.name,
      }),
    ).withError(error);
  }
  throw error;
}
