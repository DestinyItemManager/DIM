
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
 * See https://www.bungie.net/en/Help/Article/45481 for details about
 * Bungie.net OAuth.
 */

/**
 * Get all token information from saved storage.
 */
export function getToken(): Tokens | null {
  return localStorage.authorization ? JSON.parse(localStorage.authorization) : null;
}

/**
 * Save all the information about access/refresh tokens.
 */
export function setToken(token: Tokens) {
  localStorage.authorization = JSON.stringify(token);
}

/**
 * Clear any saved token information.
 */
export function removeToken() {
  localStorage.removeItem('authorization');
}

/**
 * Get an absolute UTC epoch milliseconds timestamp for either the 'expires' property.
 * @return UTC epoch milliseconds timestamp
 */
function getTokenExpiration(token: Token): number {
  if (token && token.hasOwnProperty('inception') && token.hasOwnProperty('expires')) {
    const inception = token.inception;
    return inception + (token.expires * 1000);
  }

  return 0;
}

/**
 * Has the token expired, based on its 'expires' property?
 */
export function hasTokenExpired(token: Token) {
  const expires = getTokenExpiration(token);
  const now = Date.now();

  // if (token)
  //   { console.log("Expires: " + token.name + " " + ((expires <= now)) + " " + ((expires - now) / 1000 / 60)); }

  return now > expires;
}
