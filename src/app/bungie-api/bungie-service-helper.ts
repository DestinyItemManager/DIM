import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/common';
import { HttpClientConfig } from 'bungie-api-ts/http';
import { t } from 'app/i18next-t';
import { API_KEY } from './bungie-api-utils';
import { getActivePlatform } from '../accounts/platforms';
import { fetchWithBungieOAuth, goToLoginPage } from './authenticated-fetch';
import { rateLimitedFetch } from './rate-limiter';
import { stringify } from 'simple-query-string';
import { router } from '../router';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';

export interface DimError extends Error {
  code?: PlatformErrorCodes | string;
  status?: string;
}

const ourFetch = rateLimitedFetch(fetchWithBungieOAuth);

// setTimeout as a promise
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let numThrottled = 0;

export async function httpAdapter(config: HttpClientConfig): Promise<ServerResponse<any>> {
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
  try {
    const result = await Promise.resolve(ourFetch(buildOptions(config))).then(
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
  }
}

function buildOptions(config: HttpClientConfig): Request {
  let url = config.url;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }

  return new Request(url, {
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
  } catch {}

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
    case PlatformErrorCodes.DestinyUnexpectedError:
      if (response.url.indexOf('/Account/') >= 0 && response.url.indexOf('/Character/') < 0) {
        const account = getActivePlatform();
        throw error(
          t('BungieService.NoAccount', {
            platform: account ? t(`Accounts.${account.platformLabel}`) : 'Unknown'
          }),
          errorCode
        );
      }
      break;

    case PlatformErrorCodes.DestinyLegacyPlatformInaccessible:
      throw error(t('BungieService.DestinyLegacyPlatform'), errorCode);

    case PlatformErrorCodes.ApiInvalidOrExpiredKey:
    case PlatformErrorCodes.ApiKeyMissingFromRequest:
    case PlatformErrorCodes.OriginHeaderDoesNotMatchKey:
      if ($DIM_FLAVOR === 'dev') {
        router.stateService.go('developer');
        throw error(t('BungieService.DevVersion'), errorCode);
      } else {
        throw error(t('BungieService.Difficulties'), errorCode);
      }
  }

  // Token expired and other auth maladies
  if (response.status === 401 || response.status === 403) {
    goToLoginPage();
    throw error(t('BungieService.NotLoggedIn'), errorCode);
  }
  /* 526 = cloudflare */
  if (response.status >= 503 && response.status <= 526) {
    throw error(t('BungieService.Difficulties'), errorCode);
  }
  if (errorCode === -1 && (response.status < 200 || response.status >= 400)) {
    throw error(
      t('BungieService.NetworkError', {
        status: response.status,
        statusText: response.statusText
      }),
      errorCode
    );
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

// Handle "DestinyUniquenessViolation" (1648)
export function handleUniquenessViolation(e: DimError, item: DimItem, store: DimStore): never {
  if (e && e.code === 1648) {
    throw error(
      t('BungieService.ItemUniquenessExplanation', {
        // t('BungieService.ItemUniquenessExplanation_female')
        // t('BungieService.ItemUniquenessExplanation_male')
        name: item.name,
        type: item.type.toLowerCase(),
        character: store.name,
        context: store.gender && store.gender.toLowerCase()
      }),
      e.code
    );
  }
  throw e;
}
