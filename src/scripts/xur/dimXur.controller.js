const angular = require('angular');

(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimXurCtrl', dimXurCtrl);

  function dimXurCtrl(dimXurService) {
    var vm = this;
    vm.xurService = dimXurService;
  }
})();
