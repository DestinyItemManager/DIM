import angular from 'angular';
import LocalStorageModule from 'angular-local-storage';
import { OAuthService } from './oauth.service';
import { OAuthTokenService } from './oauth-token.service';
import { HttpRefreshTokenService } from './http-refresh-token.service';

export default angular.module('dim-oauth', [LocalStorageModule])
  .service('OAuthTokenService', OAuthTokenService)
  .service('OAuthService', OAuthService)
  .service('http-refresh-token', HttpRefreshTokenService)
  .run(function($rootScope, $state) {
    $rootScope.$on('dim-no-token-found', function() {
      if ($DIM_FLAVOR !== 'dev') {
        $state.go('login');
      } else if (!localStorage.apiKey || !localStorage.authorizationURL) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  }).name;
