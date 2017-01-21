const angular = require('angular');

angular.module('dim-oauth')
  .service('OAuthTokenService', OAuthTokenService);

function OAuthTokenService(storage) {
  function getToken() {
    return storage.get('authorization');
  }

  function setToken(token) {
    storage.set('authorization', token);
  }

  function getAccessToken() {
    return (getToken()) ? getToken().accessToken : undefined;
  }

  function getRefreshToken() {
    return (getToken()) ? getToken().refreshToken : undefined;
  }

  function getAuthorizationHeader() {
    if (!getAccessToken()) {
      return undefined;
    }

    return 'Bearer ' + getAccessToken().value;
  }

  function removeToken() {
    storage.remove('authorization');
  }

  function getTokenDate(token, property, offset = 0) {
    if (token && token.hasOwnProperty('inception') && token.hasOwnProperty(property)) {
      const inception = new Date(token.inception);
      return new Date(inception.valueOf() + (token[property] * 1000) + offset);
    }

    return (new Date(0));
  }

  function hasTokenExpired(token) {
    const expires = getTokenDate(token, 'expires', -1800000).valueOf();
    const now = (new Date()).valueOf();

    if (token)
      { console.log("Expires: " + token.name + " " + ((expires <= now)) + " " + ((expires - now) / 1000 / 60)); }

    return (expires <= now);
  }

  function isTokenReady(token) {
    const readyIn = getTokenDate(token, 'readyin').valueOf();
    const now = (new Date()).valueOf();

    if (token)
      { console.log("ReadyIn: " + token.name + " " + (readyIn <= now) + " " + ((readyIn - now) / 1000 / 60)); }

    return (readyIn <= now);
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
