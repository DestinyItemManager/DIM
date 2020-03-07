import { HttpClientConfig } from 'bungie-api-ts/http';
import { stringify } from 'simple-query-string';
import { router } from 'app/router';
import { getActiveToken as getBungieToken } from 'app/bungie-api/authenticated-fetch';
import { dedupePromise } from 'app/utils/util';

const DIM_API_HOST = 'https://api.destinyitemmanager.com';
export const API_KEY =
  $DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta'
    ? $DIM_API_KEY
    : localStorage.getItem('dimApiKey')!;

/**
 * Call one of the unauthenticated DIM APIs.
 */
export async function unauthenticatedApi<T>(
  config: HttpClientConfig,
  noApiKey?: boolean
): Promise<T> {
  let url = `${DIM_API_HOST}${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }
  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers: noApiKey
        ? {}
        : config.body
        ? {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        : {
            'X-API-Key': API_KEY
          }
    })
  );

  return response.json() as Promise<T>;
}

/**
 * Call one of the authenticated DIM APIs.
 */
export async function authenticatedApi<T>(config: HttpClientConfig): Promise<T> {
  if (!API_KEY) {
    router.stateService.go('developer');
    throw new Error('No DIM API key configured');
  }

  const token = await getAuthToken();

  let url = `${DIM_API_HOST}${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }
  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers: config.body
        ? {
            Authorization: `Bearer ${token.accessToken}`,
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        : {
            Authorization: `Bearer ${token.accessToken}`,
            'X-API-Key': API_KEY
          }
    })
  );

  return response.json() as Promise<T>;
}

export interface DimAuthToken {
  /** Your DIM API access token, to be used in further requests. */
  accessToken: string;
  /** How many seconds from now the token will expire. */
  expiresInSeconds: number;
  /** A UTC epoch milliseconds timestamp representing when the token was acquired. */
  inception: number;
}

const localStorageKey = 'dimApiToken';

/**
 * Get all token information from saved storage.
 */
function getToken(): DimAuthToken | undefined {
  const tokenString = localStorage.getItem(localStorageKey);
  return tokenString ? JSON.parse(tokenString) : undefined;
}

/**
 * Save all the information about access/refresh tokens.
 */
function setToken(token: DimAuthToken) {
  localStorage.setItem(localStorageKey, JSON.stringify(token));
}

export interface AuthTokenRequest {
  /** The access token from authenticating with the Bungie.net API */
  bungieAccessToken: string;
  /** The user's Bungie.net membership ID */
  membershipId: string;
}

const refreshToken = dedupePromise(async () => {
  const bungieToken = await getBungieToken();
  const authRequest: AuthTokenRequest = {
    bungieAccessToken: bungieToken.accessToken.value,
    membershipId: bungieToken.bungieMembershipId
  };
  try {
    const authToken = await unauthenticatedApi<DimAuthToken>({
      url: '/auth/token',
      method: 'POST',
      body: authRequest
    });

    authToken.inception = Date.now();
    setToken(authToken);

    return authToken;
  } catch (e) {
    if (!($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta')) {
      router.stateService.go('developer');
      throw new Error('DIM API Key Incorrect');
    }
    throw e;
  }
});

async function getAuthToken(): Promise<DimAuthToken> {
  const token = getToken();
  if (!token || hasTokenExpired(token)) {
    // Get a token!
    return refreshToken();
  }
  return token;
}

/**
 * Has the token expired, based on its 'expires' property?
 */
function hasTokenExpired(token?: DimAuthToken) {
  if (!token) {
    return true;
  }
  const expires = token.inception + token.expiresInSeconds * 1000;
  const now = Date.now();
  return now > expires;
}
