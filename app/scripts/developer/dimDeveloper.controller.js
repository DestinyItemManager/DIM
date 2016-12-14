(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDeveloperCtrl', dimDeveloperCtrl);

  function dimDeveloperCtrl(dimFeatureFlags) {
    const vm = this;

    vm.apiKey = localStorage.apiKey;
    vm.isExtension = window.chrome && window.chrome.extension;
    vm.URL = vm.isExtension ? chrome.extension.getURL('') : window.location.origin + '/return.html';

    // could allow feature toggle through this page, as an example.
    vm.features = dimFeatureFlags;

    vm.save = function() {
      localStorage.apiKey = vm.apiKey;
      window.location = window.location.origin + '/index.html';
    };
  }
})();
