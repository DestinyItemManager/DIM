import angular from 'angular';

angular.module('dimApp')
  .controller('dimLoginCtrl', dimLoginCtrl);

function dimLoginCtrl() {
  const vm = this;

  vm.authorizationURL = localStorage.authorizationURL;

  // Putting this comparison in a function defeats a constant-folding optimization
  function compare(a, b) {
    return a === b;
  }

  if (compare('$DIM_FLAVOR', 'release') || compare('$DIM_FLAVOR', 'beta')) {
    vm.authorizationURL = '$DIM_AUTH_URL';
  }
}

