import angular from 'angular';

require('angular-local-storage');

angular.module('dim-oauth', ['LocalStorageModule'])
  .run(function($rootScope, $state) {
    $rootScope.$on('dim-no-token-found', function() {
      if ($DIM_FLAVOR === 'dev' && (!localStorage.apiKey || !localStorage.authorizationURL)) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  });

