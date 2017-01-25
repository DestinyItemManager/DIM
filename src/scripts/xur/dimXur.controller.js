const angular = require('angular');

angular.module('dimApp')
  .controller('dimXurCtrl', dimXurCtrl);

function dimXurCtrl(dimXurService) {
  var vm = this;
  vm.xurService = dimXurService;
}

