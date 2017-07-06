import angular from 'angular';

angular.module('dimApp')
  .controller('dimDeveloperCtrl', dimDeveloperCtrl);

function dimDeveloperCtrl() {
  const vm = this;

  vm.apiKey = localStorage.apiKey;
  vm.clientId = localStorage.oauthClientId;
  vm.clientSecret = localStorage.oauthClientSecret;
  vm.URL = window.location.origin;
  vm.URLRet = `${vm.URL}/return.html`;

  if (window.location.protocol === 'http:') {
    vm.warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
  }

  vm.save = function() {
    localStorage.apiKey = vm.apiKey;
    localStorage.oauthClientId = vm.clientId;
    localStorage.oauthClientSecret = vm.clientSecret;
    window.location = `${window.location.origin}/index.html`;
  };
}

