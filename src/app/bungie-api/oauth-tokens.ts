/* Helpers for storing and retrieving our OAuth tokens from localStorage */

/**
 * An OAuth token, either authorization or refresh.
 */
export interface Token {
  /** The oauth token key */
  value: string;
  /** The token expires this many seconds after it is acquired. */
  expires: number;
  name: 'access' | 'refresh';
  /** A UTC epoch milliseconds timestamp representing when the token was acquired. */
  inception: number;
}

export interface Tokens {
  accessToken: Token;
  refreshToken?: Token;
  bungieMembershipId: string;
}

/**
 * This service manages storage and management of saved OAuth
 * authorization and refresh tokens.
 *
 * See https://bungie-net.github.io/multi/index.html#about-security for details about
 * Bungie.net OAuth.
 */

const localStorageKey = 'authorization';

/**
 * Get all token information from saved storage.
 */
export function getToken(): Tokens | null {
  const tokenString = localStorage.getItem(localStorageKey);
  return tokenString ? (JSON.parse(tokenString) as Tokens) : null;
}

/**
 * Save all the information about access/refresh tokens.
 */
export function setToken(token: Tokens) {
  localStorage.setItem(localStorageKey, JSON.stringify(token));
}

/**
 * Clear any saved token information.
 */
export function removeToken() {
  localStorage.removeItem(localStorageKey);
}

/**
 * Returns whether or not we have a token that could be refreshed.
 */
export function hasValidAuthTokens() {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Get a new token from refresh token
  const refreshTokenIsValid = token && !hasTokenExpired(token.refreshToken);
  return refreshTokenIsValid;
}

/**
 * Clear any saved access token information.
 */
export function removeAccessToken() {
  const token = getToken();
  if (token) {
    // Force expiration
    token.accessToken.inception = 0;
    token.accessToken.expires = 0;
    setToken(token);
  }
}

/**
 * Get an absolute UTC epoch milliseconds timestamp for either the 'expires' property.
 * @return UTC epoch milliseconds timestamp
 */
function getTokenExpiration(token?: Token): number {
  if (token && 'inception' in token && 'expires' in token) {
    const inception = token.inception;
    return inception + token.expires * 1000;
  }

  return 0;
}

/**
 * Has the token expired, based on its 'expires' property?
 */
export function hasTokenExpired(token?: Token) {
  if (!token) {
    return true;
  }
  const expires = getTokenExpiration(token);
  const now = Date.now();

  // if (token)
  //   { log("Expires: " + token.name + " " + ((expires <= now)) + " " + ((expires - now) / 1000 / 60)); }

  return now > expires;
}
