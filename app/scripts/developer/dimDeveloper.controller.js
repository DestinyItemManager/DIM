(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDeveloperCtrl', dimDeveloperCtrl);

  function dimDeveloperCtrl(dimFeatureFlags) {
    const vm = this;

    vm.apiKey = '0e9fa66d6939491aac7cf6952f4d1b85';
    // vm.chromeURL = chrome.extension.getURL('');

    // could allow feature toggle through this page, as an example.
    vm.features = dimFeatureFlags;

    vm.save = function() {
      localStorage.apiKey = '0e9fa66d6939491aac7cf6952f4d1b85';
      window.location = '/index.html';
    };
  }
})();
