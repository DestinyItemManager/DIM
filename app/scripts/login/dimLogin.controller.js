(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimLoginCtrl', dimLoginCtrl);

  function dimLoginCtrl() {
    const vm = this;

    vm.authorizationURL = localStorage.authorizationURL;

    /* eslint no-constant-condition: 0*/
    if ('$DIM_FLAVOR' === 'release' || '$DIM_FLAVOR' === 'beta') {
      vm.authorizationURL = '$DIM_APP_URL';
    }
  }
})();
