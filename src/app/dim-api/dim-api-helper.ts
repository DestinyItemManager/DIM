import { HttpClientConfig } from 'bungie-api-ts/http';
import { stringify } from 'simple-query-string';
import {
  getActiveToken as getBungieToken,
  FatalTokenError,
} from 'app/bungie-api/authenticated-fetch';
import { dedupePromise } from 'app/utils/util';
import store from 'app/store/store';
import { needsDeveloper } from 'app/accounts/actions';

const DIM_API_HOST = 'https://api.destinyitemmanager.com';
export const API_KEY =
  $DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta'
    ? $DIM_API_KEY
    : localStorage.getItem('dimApiKey')!;

const localStorageKey = 'dimApiToken';

/**
 * Call one of the unauthenticated DIM APIs.
 */
export async function unauthenticatedApi<T>(
  config: HttpClientConfig,
  noApiKey?: boolean
): Promise<T> {
  if (!noApiKey && !API_KEY) {
    throw new Error('No DIM API key configured');
  }

  let url = `${DIM_API_HOST}${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }

  const headers = {};
  if (config.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (!noApiKey) {
    headers['X-API-Key'] = API_KEY;
  }

  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers,
    })
  );

  if (response.status === 401) {
    // Delete our token
    deleteDimApiToken();
    throw new FatalTokenError('Unauthorized call to ' + config.url);
  }
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  throw new Error('Failed to call DIM API: ' + response.status);
}

/**
 * Call one of the authenticated DIM APIs.
 */
export async function authenticatedApi<T>(config: HttpClientConfig): Promise<T> {
  if (!API_KEY) {
    throw new Error('No DIM API key configured');
  }

  const token = await getAuthToken();

  let url = `${DIM_API_HOST}${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }

  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    'X-API-Key': API_KEY,
  };
  if (config.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers,
    })
  );

  if (response.status === 401) {
    // Delete our token
    deleteDimApiToken();
  }
  if (response.ok) {
    return response.json();
  }

  try {
    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(`${responseData.error}: ${responseData.message}`);
    }
  } catch {}

  throw new Error('Failed to call DIM API: ' + response.status);
}

export interface DimAuthToken {
  /** Your DIM API access token, to be used in further requests. */
  accessToken: string;
  /** How many seconds from now the token will expire. */
  expiresInSeconds: number;
  /** A UTC epoch milliseconds timestamp representing when the token was acquired. */
  inception: number;
}

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

export function deleteDimApiToken() {
  localStorage.removeItem(localStorageKey);
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
    membershipId: bungieToken.bungieMembershipId,
  };
  try {
    const authToken = await unauthenticatedApi<DimAuthToken>({
      url: '/auth/token',
      method: 'POST',
      body: authRequest,
    });

    authToken.inception = Date.now();
    setToken(authToken);

    return authToken;
  } catch (e) {
    if (!($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta')) {
      store.dispatch(needsDeveloper()); // todo: pass in dispatch
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
