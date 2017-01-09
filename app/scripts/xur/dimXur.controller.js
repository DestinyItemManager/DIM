(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimXurCtrl', dimXurCtrl);

  dimXurCtrl.$inject = ['dimXurService'];

  function dimXurCtrl(dimXurService) {
    var vm = this;
    vm.xurService = dimXurService;
  }
})();
