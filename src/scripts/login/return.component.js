import angular from 'angular';
import simpleQueryString from 'simple-query-string';
import template from './return.component.html';
import { bungieApiUpdate } from '../services/bungie-api-utils';

angular.module('dimLogin').component('dimReturn', {
  controller: ReturnController,
  template: template
});

function ReturnController($http) {
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

    $http(bungieApiUpdate(
      '/Platform/App/GetAccessTokensFromCode/',
      {
        code: ctrl.code
      }
    ))
    .then((response) => {
      if (response.data.ErrorCode === 1) {
        const inception = Date.now();
        const authorization = {
          accessToken: angular.merge({}, response.data.Response.accessToken, { name: 'access', inception: inception }),
          refreshToken: angular.merge({}, response.data.Response.refreshToken, { name: 'refresh', inception: inception }),
          scope: response.data.Response.scope
        };

        localStorage.authorization = JSON.stringify(authorization);

        window.location = "/index.html";
      } else {
        console.error(response.data.Message, response);
      }
    });
  };
}
