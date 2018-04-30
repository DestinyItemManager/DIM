import { module } from 'angular';

export default module('dim-oauth', [])
  .run(($rootScope, $state) => {
    'ngInject';
    $rootScope.$on('dim-no-token-found', () => {
      if ($DIM_FLAVOR === 'dev' &&
          (!localStorage.apiKey || !localStorage.oauthClientId || !localStorage.oauthClientSecret)) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  }).name;
