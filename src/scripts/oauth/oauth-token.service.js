import angular from 'angular';

angular.module('dim-oauth')
  .service('OAuthTokenService', OAuthTokenService);

/**
 * This service manages storage and management of saved OAuth
 * authorization and refresh tokens.
 *
 * See https://www.bungie.net/en/Help/Article/45481 for details about
 * Bungie.net OAuth.
 */
function OAuthTokenService(localStorageService) {
  /**
   * An OAuth token, either authorization or refresh.
   * @typedef {Object} Token
   * @property {string} value - The oauth token key
   * @property {number} readyin - The token is not valid until this many seconds after it is acquired.
   * @property {number} expires - The token expires this many seconds after it is acquired.
   * @property {string} name - Either 'access' or 'refresh'.
   * @property {number} inception - A UTC epoch milliseconds timestamp representing when the token was acquired.
   */
  /**
   * Get all token information from saved storage.
   * @return {{accessToken, refreshToken, scope}}
   */
  function getToken() {
    return localStorageService.get('authorization');
  }

  /**
   * Save all the information about access/refresh tokens.
   * @param {Token} token.accessToken
   * @param {Token} token.refreshToken
   * @param {string} token.scope the scope bitfield describing allowed actions
   */
  function setToken(token) {
    localStorageService.set('authorization', token);
  }

  /**
   * Get just the access token from saved storage.
   * @return {Token}
   */
  function getAccessToken() {
    const token = getToken();
    return token ? token.accessToken : undefined;
  }

  /**
   * Get just the refresh token from saved storage.
   * @return {Token}
   */
  function getRefreshToken() {
    const token = getToken();
    return token ? token.refreshToken : undefined;
  }

  /**
   * Generate a bearer authorization header from our saved access token.
   * @return {string}
   */
  function getAuthorizationHeader() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return undefined;
    }

    return 'Bearer ' + accessToken.value;
  }

  /**
   * Clear any saved token information.
   */
  function removeToken() {
    localStorageService.remove('authorization');
  }

  /**
   * Get an absolute UTC epoch milliseconds timestamp for either the 'expires' or 'readyin' property.
   * @param {Token} token
   * @param {string} property - 'expires' or 'readyin'
   * @return {number} UTC epoch milliseconds timestamp
   */
  function getTokenDate(token, property) {
    if (token && token.hasOwnProperty('inception') && token.hasOwnProperty(property)) {
      const inception = token.inception;
      return inception + (token[property] * 1000);
    }

    return 0;
  }

  /**
   * Has the token expired, based on its 'expires' property?
   */
  function hasTokenExpired(token) {
    const expires = getTokenDate(token, 'expires');
    const now = Date.now();

    // if (token)
    //   { console.log("Expires: " + token.name + " " + ((expires <= now)) + " " + ((expires - now) / 1000 / 60)); }

    return now > expires;
  }

  /**
   * Is the token ready to use, based on its 'readyin' property?
   */
  function isTokenReady(token) {
    const readyIn = getTokenDate(token, 'readyin');
    const now = Date.now();

    // if (token)
    //   { console.log("ReadyIn: " + token.name + " " + (readyIn <= now) + " " + ((readyIn - now) / 1000 / 60)); }

    return now > readyIn;
  }

  return {
    getToken,
    setToken,
    getAccessToken,
    getRefreshToken,
    getAuthorizationHeader,
    removeToken,
    hasTokenExpired,
    isTokenReady
  };
}
