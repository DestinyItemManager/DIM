import angular from 'angular';

angular.module('dimApp')
  .controller('dimDeveloperCtrl', dimDeveloperCtrl);

function dimDeveloperCtrl(dimFeatureFlags) {
  const vm = this;

  vm.features = dimFeatureFlags;

  vm.apiKey = localStorage.apiKey;
  vm.isExtension = vm.features.isExtension;
  vm.URL = window.location.origin;
  vm.URLRet = vm.URL + '/return.html';

  if (!vm.isExtension && window.location.protocol === 'http:') {
    vm.warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
  }


  vm.save = function() {
    localStorage.apiKey = vm.apiKey;
    localStorage.authorizationURL = vm.authorizationURL;
    window.location = window.location.origin + '/index.html';
  };
}

