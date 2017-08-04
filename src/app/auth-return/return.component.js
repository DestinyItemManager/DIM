import simpleQueryString from 'simple-query-string';
import template from './return.component.html';

export const ReturnComponent = {
  controller: ReturnController,
  template: template
};

function ReturnController($http, OAuthService, OAuthTokenService) {
  'ngInject';

  const ctrl = this;

  ctrl.code = "";
  ctrl.state = "";
  ctrl.authorized = false;

  ctrl.$onInit = function() {
    const queryString = simpleQueryString.parse(window.location.href);

    ctrl.code = queryString.code;
    ctrl.state = queryString.state;
    ctrl.authorized = (ctrl.code && ctrl.code.length > 0);

    if (!ctrl.authorized) {
      ctrl.error = "We expected an authorization code parameter from Bungie.net, but didn't get one.";
      return;
    }

    if (ctrl.state !== localStorage.authorizationState) {
      ctrl.error = "We expected the state parameter to match what we stored, but it didn't.";
      if (!localStorage.authorizationState) {
        ctrl.error += " There was no stored state at all - your browser may not support (or may be blocking) localStorage.";
      }
      return;
    }

    OAuthService.getAccessTokenFromCode(ctrl.code)
      .then((token) => {
        OAuthTokenService.setToken(token);
        window.location = "/index.html";
      })
      .catch((error) => {
        if (error.status === -1) {
          ctrl.error = 'A content blocker is interfering with either DIM or Bungie.net, or you are not connected to the internet.';
          return;
        }
        console.error(error);
        ctrl.error = error.message || (error.data && error.data.error_description) || "Unknown";
      });
  };
}
