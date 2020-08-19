import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/common';
import { HttpClientConfig } from 'bungie-api-ts/http';
import { t } from 'app/i18next-t';
import { API_KEY } from './bungie-api-utils';
import { fetchWithBungieOAuth, goToLoginPage } from './authenticated-fetch';
import { rateLimitedFetch } from './rate-limiter';
import { stringify } from 'simple-query-string';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { delay } from 'app/utils/util';
import store from 'app/store/store';
import { needsDeveloper } from 'app/accounts/actions';
import { showNotification } from 'app/notifications/notifications';
import _ from 'lodash';

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

const ourFetch = rateLimitedFetch(fetchWithBungieOAuth);

let numThrottled = 0;

export async function httpAdapter(
  config: HttpClientConfig,
  skipAuth?: boolean
): Promise<ServerResponse<any>> {
  const startTime = Date.now();
  const timer = setTimeout(() => notifyTimeout(startTime, TIMEOUT), TIMEOUT);

  if (numThrottled > 0) {
    // Double the wait time, starting with 1 second, until we reach 5 minutes.
    const waitTime = Math.min(5 * 60 * 1000, Math.pow(2, numThrottled) * 500);
    console.log(
      'Throttled',
      numThrottled,
      'times, waiting',
      waitTime,
      'ms before calling',
      config.url
    );
    await delay(waitTime);
  }

  const whichFetch = skipAuth ? fetch : ourFetch;
  try {
    const result = await Promise.resolve(whichFetch(buildOptions(config, skipAuth))).then(
      handleErrors,
      handleErrors
    );
    // Quickly heal from being throttled
    numThrottled = Math.floor(numThrottled / 2);
    return result;
  } catch (e) {
    switch (e.code) {
      case PlatformErrorCodes.ThrottleLimitExceededMinutes:
      case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
      case PlatformErrorCodes.ThrottleLimitExceededSeconds:
      case PlatformErrorCodes.DestinyThrottledByGameServer:
      case PlatformErrorCodes.PerApplicationThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAnonymousThrottleExceeded:
      case PlatformErrorCodes.PerApplicationAuthenticatedThrottleExceeded:
      case PlatformErrorCodes.PerUserThrottleExceeded:
      case PlatformErrorCodes.SystemDisabled:
        numThrottled++;
        break;
    }
    throw e;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function buildOptions(config: HttpClientConfig, skipAuth?: boolean): Request {
  let url = config.url;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }

  return new Request(url, {
    method: config.method,
    body: config.body ? JSON.stringify(config.body) : undefined,
    headers: config.body
      ? {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        }
      : {
          'X-API-Key': API_KEY,
        },
    credentials: skipAuth ? 'omit' : 'include',
  });
}

/** Generate an error with a bit more info */
export function error(message: string, errorCode: PlatformErrorCodes): DimError {
  const error: DimError = new Error(message);
  error.code = errorCode;
  return error;
}

export async function handleErrors<T>(response: Response): Promise<ServerResponse<T>> {
  if (response instanceof DOMException && response.name === 'AbortError') {
    throw new Error(
      navigator.onLine ? t('BungieService.SlowResponse') : t('BungieService.NotConnected')
    );
  }

  if (response instanceof TypeError) {
    throw new Error(
      navigator.onLine ? t('BungieService.NotConnectedOrBlocked') : t('BungieService.NotConnected')
    );
  }

  if (response instanceof Error) {
    throw response;
  }

  if (response.status === -1) {
    throw new Error(
      navigator.onLine ? t('BungieService.NotConnectedOrBlocked') : t('BungieService.NotConnected')
    );
  }

  let data: ServerResponse<any> | undefined;
  try {
    data = await response.json();
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Error parsing Bungie.net response', e);
      throw new Error(t('BungieService.Difficulties'));
    }
  }

  // There's an alternate error response that can be returned during maintenance
  const eMessage = data && (data as any).error && (data as any).error_description;
  if (eMessage) {
    const e = error(
      t('BungieService.UnknownError', { message: eMessage }),
      PlatformErrorCodes.DestinyUnexpectedError
    );
    throw e;
  }

  const errorCode = data ? data.ErrorCode : -1;

  // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
  switch (errorCode) {
    case PlatformErrorCodes.Success:
      return data!;

    case PlatformErrorCodes.DestinyVendorNotFound:
      throw error(t('BungieService.VendorNotFound'), errorCode);

    case PlatformErrorCodes.AuthorizationCodeInvalid:
    case PlatformErrorCodes.AccessNotPermittedByApplicationScope:
      goToLoginPage();
      throw error('DIM does not have permission to perform this action.', errorCode);

    case PlatformErrorCodes.SystemDisabled:
      throw error(t('BungieService.Maintenance'), errorCode);

    case PlatformErrorCodes.ThrottleLimitExceededMinutes:
    case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
    case PlatformErrorCodes.ThrottleLimitExceededSeconds:
    case PlatformErrorCodes.DestinyThrottledByGameServer:
    case PlatformErrorCodes.PerApplicationThrottleExceeded:
    case PlatformErrorCodes.PerApplicationAnonymousThrottleExceeded:
    case PlatformErrorCodes.PerApplicationAuthenticatedThrottleExceeded:
    case PlatformErrorCodes.PerUserThrottleExceeded:
      throw error(t('BungieService.Throttled'), errorCode);

    case PlatformErrorCodes.AccessTokenHasExpired:
    case PlatformErrorCodes.WebAuthRequired:
    case PlatformErrorCodes.WebAuthModuleAsyncFailed: // means the access token has expired
      goToLoginPage();
      throw error(t('BungieService.NotLoggedIn'), errorCode);

    case PlatformErrorCodes.DestinyAccountNotFound:
      if (response.url.indexOf('/Account/') >= 0 && response.url.indexOf('/Character/') < 0) {
        throw error(t('BungieService.NoAccount'), errorCode);
      } else {
        throw error(t('BungieService.Difficulties'), errorCode);
      }

    case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
      throw error(t('BungieService.DestinyLegacyPlatform'), errorCode);

    case PlatformErrorCodes.ApiInvalidOrExpiredKey:
    case PlatformErrorCodes.ApiKeyMissingFromRequest:
    case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
      if ($DIM_FLAVOR === 'dev') {
        store.dispatch(needsDeveloper());
        throw error(t('BungieService.DevVersion'), errorCode);
      } else {
        throw error(t('BungieService.Difficulties'), errorCode);
      }

    case PlatformErrorCodes.DestinyUnexpectedError:
      throw error(t('BungieService.Difficulties'), errorCode);
  }

  // Token expired and other auth maladies
  if (response.status === 401 || response.status === 403) {
    goToLoginPage();
    throw error(t('BungieService.NotLoggedIn'), errorCode);
  }
  // 526 = cloudflare
  // We don't catch 500s because the Bungie.net API started returning 500 for legitimate game conditions
  if (response.status >= 502 && response.status <= 526) {
    throw error(t('BungieService.Difficulties'), errorCode);
  }
  if (errorCode === -1 && (response.status < 200 || response.status >= 400)) {
    throw error(
      t('BungieService.NetworkError', {
        status: response.status,
        statusText: response.statusText,
      }),
      errorCode
    );
  }

  // Any other error
  if (data?.Message) {
    const e = error(t('BungieService.UnknownError', { message: data.Message }), errorCode);
    e.status = data.ErrorStatus;
    throw e;
  } else {
    console.error('No response data:', response.status, response.statusText);
    throw new Error(t('BungieService.Difficulties'));
  }
}

// Handle "DestinyUniquenessViolation" (1648)
export function handleUniquenessViolation(e: DimError, item: DimItem, store: DimStore): never {
  if (e?.code === 1648) {
    throw error(
      t('BungieService.ItemUniquenessExplanation', {
        // t('BungieService.ItemUniquenessExplanation_female')
        // t('BungieService.ItemUniquenessExplanation_male')
        name: item.name,
        type: item.type.toLowerCase(),
        character: store.name,
        context: store.genderName,
      }),
      e.code
    );
  }
  throw e;
}
