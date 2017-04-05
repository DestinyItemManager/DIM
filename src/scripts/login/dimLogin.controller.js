import angular from 'angular';
import './login.scss';

angular.module('dimApp')
  .controller('dimLoginCtrl', dimLoginCtrl);

function dimLoginCtrl() {
  const vm = this;

  if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
    if (window.chrome && window.chrome.extension) {
      vm.authorizationURL = $DIM_AUTH_URL;
    } else {
      vm.authorizationURL = $DIM_WEB_AUTH_URL;
    }
  } else {
    vm.authorizationURL = localStorage.authorizationURL;
  }
}

