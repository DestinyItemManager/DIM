import { needsDeveloper } from 'app/accounts/actions';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import store from 'app/store/store';
import { errorLog, infoLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { HttpClient, HttpClientConfig } from 'bungie-api-ts/http';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { fetchWithBungieOAuth, goToLoginPage } from './authenticated-fetch';
import { API_KEY } from './bungie-api-utils';
import {
  BungieError,
  createFetchWithNonStoppingTimeout,
  createHttpClient,
  HttpStatusError,
  responsivelyThrottleHttpClient,
} from './http-client';
import { rateLimitedFetch } from './rate-limiter';

export interface DimError extends Error {
  code?: PlatformErrorCodes | string;
  status?: string;
}

const TIMEOUT = 15000;
const notifyTimeout = _.throttle(
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
  { leading: true, trailing: false }
);

const logThrottle = (timesThrottled: number, waitTime: number, url: string) =>
  infoLog(
    'bungie api',
    'Throttled',
    timesThrottled,
    'times, waiting',
    waitTime,
    'ms before calling',
    url
  );

// it would be really great if they implemented the pipeline operator soon
/** used for most Bungie API requests */
export const authenticatedHttpClient = dimErrorHandledHttpClient(
  responsivelyThrottleHttpClient(
    createHttpClient(
      createFetchWithNonStoppingTimeout(
        rateLimitedFetch(fetchWithBungieOAuth),
        TIMEOUT,
        notifyTimeout
      ),
      API_KEY,
      true
    ),
    logThrottle
  )
);

/** used to get manifest and global alerts*/
export const unauthenticatedHttpClient = dimErrorHandledHttpClient(
  responsivelyThrottleHttpClient(
    createHttpClient(
      createFetchWithNonStoppingTimeout(fetch, TIMEOUT, notifyTimeout),
      API_KEY,
      false
    ),
    logThrottle
  )
);

/** Generate an error with a bit more info */
export function dimError(message: string, errorCode: PlatformErrorCodes): DimError {
  const error: DimError = new Error(message);
  error.code = errorCode;
  return error;
}

/**
 * wrap HttpClient in handling specific to DIM, using i18n strings, bounce to login, etc
 */
export function dimErrorHandledHttpClient(httpClient: HttpClient): HttpClient {
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
export function handleErrors(error: Error) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    throw new Error(
      navigator.onLine ? t('BungieService.SlowResponse') : t('BungieService.NotConnected')
    );
  }

  if (error instanceof SyntaxError) {
    errorLog('bungie api', 'Error parsing Bungie.net response', error);
    throw new Error(t('BungieService.Difficulties'));
  }

  if (error instanceof TypeError) {
    throw new Error(
      navigator.onLine ? t('BungieService.NotConnectedOrBlocked') : t('BungieService.NotConnected')
    );
  }

  if (error instanceof HttpStatusError) {
    // "I don't think they exist" --Westley, The Princess Bride (1987)
    if (error.status === -1) {
      throw new Error(
        navigator.onLine
          ? t('BungieService.NotConnectedOrBlocked')
          : t('BungieService.NotConnected')
      );
    }

    // Token expired and other auth maladies
    if (error.status === 401 || error.status === 403) {
      goToLoginPage();
      throw dimError(t('BungieService.NotLoggedIn'), error.status);
    }

    // 526 = cloudflare
    // We don't catch 500s because the Bungie.net API started returning 500 for legitimate game conditions
    if (error.status >= 502 && error.status <= 526) {
      throw dimError(t('BungieService.Difficulties'), error.status);
    }

    // if no specific other http error
    throw dimError(
      t('BungieService.NetworkError', {
        status: error.status,
        statusText: error.message,
      }),
      error.status
    );
  }

  // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
  if (error instanceof BungieError) {
    switch (error.code ?? -1) {
      case PlatformErrorCodes.DestinyVendorNotFound:
        throw dimError(t('BungieService.VendorNotFound'), error.code!);

      case PlatformErrorCodes.AuthorizationCodeInvalid:
      case PlatformErrorCodes.AccessNotPermittedByApplicationScope:
        goToLoginPage();
        throw dimError('DIM does not have permission to perform this action.', error.code!);

      case PlatformErrorCodes.SystemDisabled:
        throw dimError(t('BungieService.Maintenance'), error.code!);

      case PlatformErrorCodes.ThrottleLimitExceededMinutes:
      case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
      case PlatformErrorCodes.ThrottleLimitExceededSeconds:
      case PlatformErrorCodes.DestinyThrottledByGameServer:
      case PlatformErrorCodes.PerApplicationThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAnonymousThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAuthenticatedThrottleExceeded:
      case PlatformErrorCodes.PerUserThrottleExceeded:
        throw dimError(t('BungieService.Throttled'), error.code!);

      case PlatformErrorCodes.AccessTokenHasExpired:
      case PlatformErrorCodes.WebAuthRequired:
      case PlatformErrorCodes.WebAuthModuleAsyncFailed: // means the access token has expired
        goToLoginPage();
        throw dimError(t('BungieService.NotLoggedIn'), error.code!);

      case PlatformErrorCodes.DestinyAccountNotFound:
        if (error.endpoint.includes('/Account/') && !error.endpoint.includes('/Character/')) {
          throw dimError(t('BungieService.NoAccount'), error.code!);
        } else {
          throw dimError(t('BungieService.Difficulties'), error.code!);
        }

      case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
        throw dimError(t('BungieService.DestinyLegacyPlatform'), error.code!);

      case PlatformErrorCodes.ApiInvalidOrExpiredKey:
      case PlatformErrorCodes.ApiKeyMissingFromRequest:
      case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
        if ($DIM_FLAVOR === 'dev') {
          store.dispatch(needsDeveloper());
          throw dimError(t('BungieService.DevVersion'), error.code!);
        } else {
          throw dimError(t('BungieService.Difficulties'), error.code!);
        }

      case PlatformErrorCodes.DestinyUnexpectedError:
        throw dimError(t('BungieService.Difficulties'), error.code!);
      default: {
        const e = dimError(
          t('BungieService.UnknownError', { message: error.message }),
          error.code!
        );
        e.status = error.status;
        throw e;
      }
    }
  }

  // Any other error
  errorLog('bungie api', 'No response data:', error);
  throw new Error(t('BungieService.Difficulties'));
}

// Handle "DestinyUniquenessViolation" (1648)
export function handleUniquenessViolation(
  error: BungieError,
  item: DimItem,
  store: DimStore
): never {
  if (error?.code === PlatformErrorCodes.DestinyUniquenessViolation) {
    throw dimError(
      t('BungieService.ItemUniquenessExplanation', {
        name: item.name,
        type: item.type.toLowerCase(),
        character: store.name,
        context: store.genderName,
      }),
      error.code
    );
  }
  throw error;
}
