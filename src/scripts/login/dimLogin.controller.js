import angular from 'angular';

angular.module('dimApp')
  .controller('dimLoginCtrl', dimLoginCtrl);

function dimLoginCtrl() {
  const vm = this;

  if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
    vm.authorizationURL = '$DIM_AUTH_URL';
  } else {
    vm.authorizationURL = localStorage.authorizationURL;
  }
}

