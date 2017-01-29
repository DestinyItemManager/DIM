const angular = require('angular');

angular.module('dim-oauth', ['LocalStorageModule'])
  .run(function($rootScope, $state) {
    $rootScope.$on('dim-no-token-found', function() {
      if (!localStorage.apiKey || !localStorage.authorizationURL) {
        $state.go('developer');
      } else {
        $state.go('login');
      }
    });
  });

