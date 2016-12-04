(function() {
  angular.module('dim-oauth', ['LocalStorageModule'])
    .run(['$rootScope', ($rootScope) => {
      $rootScope.$on('dim-no-token-found', function() {
        // window.location = "/login.html";
      });
    }]);
})();
