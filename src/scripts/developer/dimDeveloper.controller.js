import angular from 'angular';

angular.module('dimApp')
  .controller('dimDeveloperCtrl', dimDeveloperCtrl);

function dimDeveloperCtrl() {
  const vm = this;
  const isExtension = window.chrome && window.chrome.extension;

  vm.apiKey = localStorage.apiKey;
  vm.URL = window.location.origin;
  vm.URLRet = vm.URL + '/return.html';

  if (!isExtension && window.location.protocol === 'http:') {
    vm.warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
  }

  vm.save = function() {
    localStorage.apiKey = vm.apiKey;
    localStorage.authorizationURL = vm.authorizationURL;
    window.location = window.location.origin + '/index.html';
  };
}

