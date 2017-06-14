import angular from 'angular';
import simpleQueryString from 'simple-query-string';
import template from './return.component.template.html';

angular.module('dimLogin').component('dimReturn', {
  controller: ReturnController,
  template: template
});

function ReturnController($http, OAuthService, OAuthTokenService) {
  var ctrl = this;

  ctrl.code = "";
  ctrl.state = "";
  ctrl.authorized = false;

  ctrl.$onInit = function() {
    const queryString = simpleQueryString.parse(window.location.href);

    ctrl.code = queryString.code;
    ctrl.state = queryString.state;
    ctrl.authorized = (ctrl.code.length > 0);

    if (ctrl.state !== localStorage.authorizationState) {
      window.location = "/index.html#!/login";
      return;
    }

    OAuthService.getAccessTokenFromCode(ctrl.code)
      .then((token) => {
        OAuthTokenService.setToken(token);
        window.location = "/index.html";
      })
      .catch((error) => {
        console.error(error);
      });
  };
}
