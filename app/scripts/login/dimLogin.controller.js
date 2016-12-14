(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimLoginCtrl', dimLoginCtrl);

  function dimLoginCtrl(dimFeatureFlags) {
    const vm = this;

    vm.authorizationURL = localStorage.authorizationURL;
  }
})();
