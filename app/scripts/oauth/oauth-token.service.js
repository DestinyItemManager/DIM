(function() {
  function OAuthTokenService(storage) {
    function getToken() {
      return storage.get('authorization');
    }

    function setToken(token) {
      storage.set('authorization', JSON.stringify(token));
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
      const expires = getTokenDate(token, 'expires', -300000).valueOf();
      const now = (new Date()).valueOf();

      return (expires <= now);
    }

    function isTokenReady(token) {
      const readyIn = getTokenDate(token, 'readyin').valueOf();
      const now = (new Date()).valueOf();

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

  OAuthTokenService.$inject = ['localStorageService'];

  angular.module('dim-oauth')
    .service('OAuthTokenService', OAuthTokenService);
})();
