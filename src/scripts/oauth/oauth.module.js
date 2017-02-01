import angular from 'angular';

require('angular-local-storage');

angular.module('dim-oauth', ['LocalStorageModule'])
  .run(function($rootScope, $state) {
    'ngInject';

    $rootScope.$on('dim-no-token-found', function() {
      if (!localStorage.apiKey || !localStorage.authorizationURL) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  });

