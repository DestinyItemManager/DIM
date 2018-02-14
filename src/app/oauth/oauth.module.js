import angular from 'angular';
import { HttpRefreshTokenService } from './http-refresh-token.service';

export default angular.module('dim-oauth', [])
  .service('http-refresh-token', HttpRefreshTokenService)
  .run(($rootScope, $state) => {
    $rootScope.$on('dim-no-token-found', () => {
      if ($DIM_FLAVOR === 'dev' &&
          (!localStorage.apiKey || !localStorage.oauthClientId || !localStorage.oauthClientSecret)) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  }).name;
