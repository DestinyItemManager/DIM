(function() {
  function ReturnController($http, $q) {
    var ctrl = this;

    ctrl.code = "";
    ctrl.state = "";
    ctrl.authorized = false;

    ctrl.$onInit = function() {
      const queryString = simpleQueryString.parse(window.location.href);

      ctrl.code = queryString.code;
      ctrl.state = queryString.state;
      ctrl.authorized = (ctrl.code.length > 0);

      const apiKey = localStorage.apiKey;

      $http({
        method: 'POST',
        url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromCode/',
        headers: {
          'X-API-Key': apiKey
        },
        data: {
          code: ctrl.code
        }
      })
      .then((response) => {
        if (response.data.ErrorCode === 1) {
          const inception = new Date().toISOString();

          debugger;

          const authorization = {
            accessToken: angular.merge({}, response.data.Response.accessToken, { name: 'access', inception: inception }),
            refreshToken: angular.merge({}, response.data.Response.refreshToken, { name: 'refresh', inception: inception }),
            scope: response.data.Response.scope
          };

          localStorage.authorization = JSON.stringify(authorization);

          window.location = "/index.html";
        }
      });
    };

  }

  angular.module('dimLogin').component('dimReturn', {
    controller: ['$http', '$q', ReturnController],
    templateUrl: '/scripts/login/return.component.html'
  });
})();
