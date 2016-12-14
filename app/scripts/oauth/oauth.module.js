(function() {
  angular.module('dim-oauth', ['LocalStorageModule'])
    .run(['$rootScope', '$state', ($rootScope, $state) => {
      $rootScope.$on('dim-no-token-found', function() {
        if (!localStorage.apiKey) {
          $state.go('developer');
        } else {
          window.location = "/login.html";
        }
      });
    }]);
})();
