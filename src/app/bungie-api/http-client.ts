import { convertToError } from 'app/utils/errors';
import { delay } from 'app/utils/promises';
import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/destiny2';
import { HttpClient, HttpClientConfig } from 'bungie-api-ts/http';

/**
 * an error indicating a non-200 response code
 */
export class HttpStatusError extends Error {
  status: number;
  responseBody?: string;

  constructor(response: Response, responseBody?: string) {
    super(responseBody ?? response.statusText);
    this.status = response.status;
    this.responseBody = responseBody;
  }
}

export async function toHttpStatusError(response: Response) {
  try {
    const responseBody = await response.text();
    return new HttpStatusError(response, responseBody);
  } catch {
    return new HttpStatusError(response);
  }
}

/**
 * an error indicating the Bungie API sent back a parseable response,
 * and that response indicated the request was not successful
 */
export class BungieError extends Error {
  code?: PlatformErrorCodes;
  status?: string;
  endpoint: string;
  constructor(
    response: Partial<Pick<ServerResponse<unknown>, 'Message' | 'ErrorCode' | 'ErrorStatus'>>,
    request: Request,
  ) {
    super(response.Message ?? 'Unknown Bungie Error');
    this.name = 'BungieError';
    this.code = response.ErrorCode;
    this.status = response.ErrorStatus;
    this.endpoint = request.url;
  }
}

/**
 * this is a non-affecting pass-through for successful http requests,
 * but throws JS errors for a non-200 response
 */
async function throwHttpError(response: Response) {
  if (response.status < 200 || response.status >= 400) {
    throw await toHttpStatusError(response);
  }
}

/**
 * sometimes what you have looks like a Response but it's actually an Error
 *
 * this is a non-affecting pass-through for successful API interactions,
 * but throws JS errors for "successful" fetches with Bungie error information
 */
function throwBungieError<T>(serverResponse: T | undefined, request: Request) {
  if (!serverResponse || typeof serverResponse !== 'object') {
    return serverResponse;
  }

  // There's an alternate error response that can be returned during maintenance
  const eMessage =
    'error' in serverResponse &&
    'error_description' in serverResponse &&
    (serverResponse.error_description as string);
  if (eMessage) {
    throw new BungieError(
      {
        Message: eMessage,
        ErrorCode: PlatformErrorCodes.DestinyUnexpectedError,
        ErrorStatus: eMessage,
      },
      request,
    );
  }

  if ('ErrorCode' in serverResponse && serverResponse.ErrorCode !== PlatformErrorCodes.Success) {
    throw new BungieError(serverResponse as Partial<ServerResponse<unknown>>, request);
  }

  return serverResponse;
}

//
// FETCH UTILS
//

/**
 * returns a fetch-like that will run a function if the request is taking a long time,
 * e.g. generate a "still waiting!" notification
 *
 * @param fetchFunction use this function to make the request
 * @param timeout run onTimeout after this many milliseconds
 * @param onTimeout the request's startTime and timeout will be passed to this
 */
export function createFetchWithNonStoppingTimeout(
  fetchFunction: typeof fetch,
  timeout: number,
  onTimeout: (startTime: number, timeout: number) => void,
): typeof fetch {
  return async (...[input, init]: Parameters<typeof fetch>) => {
    const startTime = Date.now();
    const timer = setTimeout(() => onTimeout(startTime, timeout), timeout);

    try {
      return await fetchFunction(input, init);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  };
}

//
// HTTPCLIENT UTILS
//

export function createHttpClient(fetchFunction: typeof fetch, apiKey: string): HttpClient {
  return async <T>(config: HttpClientConfig) => {
    let url = config.url;
    if (config.params) {
      url = `${url}?${new URLSearchParams(config.params).toString()}`;
    }

    const fetchOptions = new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers: {
        'X-API-Key': apiKey,
        ...(config.body ? { 'Content-Type': 'application/json' } : undefined),
      },
      credentials: 'omit',
    });

    if ($featureFlags.simulateBungieMaintenance) {
      throw new BungieError(
        {
          ErrorCode: PlatformErrorCodes.SystemDisabled,
          ErrorStatus: 'SystemDisabled',
          Message: 'This system is temporarily disabled for maintenance.',
        },
        fetchOptions,
      );
    }

    const response = await fetchFunction(fetchOptions);
    let data: T | undefined;
    let parseError: Error | undefined;
    try {
      data = (await response.json()) as T;
    } catch (e) {
      parseError = convertToError(e);
    }

    // try throwing bungie errors, which have more information, first
    throwBungieError(data, fetchOptions);
    // then throw errors on generic http error codes
    await throwHttpError(response);
    if (parseError) {
      throw parseError;
    }
    return data!; // At this point it's not undefined, there would've been a parse error
  };
}

let timesThrottled = 0;
/**
 * accepts an HttpClient and returns it with added throttling. throttles by increasing amounts
 * as it encounters Bungie API responses that indicate we should back off the requests, and
 * passes any thrown errors upstream
 *
 * @param httpClient use this client to make the API request
 * @param onThrottle run this when throttling happens. information about the throttling is passed in
 */
export function responsivelyThrottleHttpClient(
  httpClient: HttpClient,
  onThrottle: (timesThrottled: number, waitTime: number, url: string) => void,
): HttpClient {
  return async <T>(config: HttpClientConfig): Promise<T> => {
    if (timesThrottled > 0) {
      // Double the wait time, starting with 1 second, until we reach 5 minutes.
      const waitTime = Math.min(5 * 60 * 1000, Math.pow(2, timesThrottled) * 500);
      onThrottle(timesThrottled, waitTime, config.url);
      await delay(waitTime);
    }

    try {
      const result = await httpClient<T>(config);
      // Quickly heal from being throttled
      timesThrottled = Math.floor(timesThrottled / 2);

      return result;
    } catch (e) {
      if (e instanceof BungieError) {
        switch (e.code) {
          case PlatformErrorCodes.ThrottleLimitExceededMinutes:
          case PlatformErrorCodes.ThrottleLimitExceededMomentarily:
          case PlatformErrorCodes.ThrottleLimitExceededSeconds:
          case PlatformErrorCodes.DestinyThrottledByGameServer:
          case PlatformErrorCodes.PerApplicationThrottleExceeded:
          case PlatformErrorCodes.PerApplicationAnonymousThrottleExceeded:
          case PlatformErrorCodes.PerApplicationAuthenticatedThrottleExceeded:
          case PlatformErrorCodes.PerUserThrottleExceeded:
            timesThrottled++;
            break;
          default:
            break;
        }
      }
      throw e;
    }
  };
}
