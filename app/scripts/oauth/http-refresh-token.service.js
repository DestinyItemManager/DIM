(function() {
  function HttpRefreshTokenService($q, $injector) {
    var service = this;

    var cache = {};

    function getAuthorizationFromLS() {
      var authorization = null;

      if (localStorage.authorization) {
        try {
          authorization = JSON.parse(localStorage.authorization);
        } catch (e) {
          authorization = null;
        }
      }

      return authorization;
    }

    service.request = (config) => {
      return $q.when(config);
    };

    service.requestError = (rejection) => {
      return $q.reject(rejection);
    };

    service.response = (response) => {
      const limiters = [
        /www\.bungie.net\/*/
      ];

      const matched = _.find(limiters, (limiter) => {
        return response.config.url.match(limiter);
      });

      if (matched && response.config.headers.Authorization) {
        switch (response.data.ErrorCode) {
        case 1:
          {
            // Do Nothing
            break;
          }
        case 99:
          {
            const authorization = getAuthorizationFromLS();

            if (authorization) {
              if (!cache[authorization.inception]) {
                var $http = $injector.get('$http');

                cache[authorization.inception] = $http({
                  method: 'POST',
                  url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromRefreshToken/',
                  headers: {
                    'X-API-Key': localStorage.apiKey,
                  },
                  data: {
                    refreshToken: authorization.refreshToken.value
                  }
                })
                .then((refreshResponse) => {
                  if (refreshResponse.data.ErrorCode === 1) {
                    if (refreshResponse.data.Response && refreshResponse.data.Response.accessToken) {
                      authorization.accessToken = refreshResponse.data.Response.accessToken;
                      authorization.refreshToken = refreshResponse.data.Response.refreshToken;
                      authorization.inception = new Date();
                      authorization.scope = refreshResponse.data.Response.scope;

                      localStorage.authorization = JSON.stringify(authorization);
                    }
                  } else {
                    return $q.reject(response);
                  }

                  return response;
                })
                .then((response) => {
                  response.config.headers.Authorization = 'Bearer ' + authorization.accessToken.value;
                  return $http(response.config);
                });
              }

              return cache[authorization.inception];
            } else {
              return $q.reject(response);
            }
          }
        case 2108:
          {
            break;
          }
        default:
          {
            break;
          }
        }
      }
      return $q.when(response);
    };

    service.responseError = (rejection) => {
      return $q.reject(rejection);
    };
  }

  HttpRefreshTokenService.$inject = ['$q', '$injector'];

  angular.module('dimApp').service('http-refresh-token', HttpRefreshTokenService);
})();
