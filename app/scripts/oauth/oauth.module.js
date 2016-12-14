(function() {
  angular.module('dim-oauth', ['LocalStorageModule'])
    .run(['$rootScope', '$state', ($rootScope, $state) => {
      $rootScope.$on('dim-no-token-found', function() {
        if (!localStorage.apiKey || !localStorage.authorizationURL) {
          $state.go('developer');
        } else {
          $state.go('login');
        }
      });
    }]);
})();
