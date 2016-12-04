(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDeveloperCtrl', dimDeveloperCtrl);

  function dimDeveloperCtrl(dimFeatureFlags) {
    const vm = this;

    vm.apiKey = 'a16976e9c1ec49c0b7673c10ce357393';
    // vm.chromeURL = chrome.extension.getURL('');

    // could allow feature toggle through this page, as an example.
    vm.features = dimFeatureFlags;

    vm.save = function() {
      localStorage.apiKey = 'a16976e9c1ec49c0b7673c10ce357393';
      window.location = '/index.html';
    };
  }
})();
