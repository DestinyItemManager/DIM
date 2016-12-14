(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDeveloperCtrl', dimDeveloperCtrl);

  function dimDeveloperCtrl(dimFeatureFlags) {
    const vm = this;

    vm.apiKey = localStorage.apiKey;
    vm.URL = window.chrome && window.chrome.extension ? chrome.extension.getURL('') : window.location.host;

    // could allow feature toggle through this page, as an example.
    vm.features = dimFeatureFlags;

    vm.save = function() {
      localStorage.apiKey = vm.apiKey;
      window.location = vm.URL + '/index.html';
    };
  }
})();
