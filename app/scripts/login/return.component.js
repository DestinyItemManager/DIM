(function () {
  function ReturnController($http) {
    var ctrl = this;

    ctrl.code = "";
    ctrl.state = "";
    ctrl.authorized = false;

    ctrl.$onInit = function () {
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
      }).then(console.log.bind(console));
    };
  }

  angular.module('dimLogin').component('dimReturn', {
    controller: ['$http', ReturnController],
    templateUrl: '/scripts/login/return.component.html'
  });
})();
