(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDeveloperCtrl', dimDeveloperCtrl);

  function dimDeveloperCtrl(dimFeatureFlags) {
    const vm = this;

    vm.apiKey = localStorage.apiKey;
    vm.chromeURL = chrome.extension.getURL('');

    // could allow feature toggle through this page, as an example.
    vm.features = dimFeatureFlags;

    vm.save = function() {
      localStorage.apiKey = vm.apiKey;
      window.location = vm.chromeURL + 'index.html';
    }
  }
})();
