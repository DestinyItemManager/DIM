import { module } from 'angular';
import { router } from '../../router';

export default module('dim-oauth', [])
  .run(($rootScope) => {
    'ngInject';
    $rootScope.$on('dim-no-token-found', () => {
      if ($DIM_FLAVOR === 'dev' &&
          (!localStorage.apiKey || !localStorage.oauthClientId || !localStorage.oauthClientSecret)) {
        router.stateService.go('developer');
      } else {
        router.stateService.go('login');
      }
    });
  }).name;
