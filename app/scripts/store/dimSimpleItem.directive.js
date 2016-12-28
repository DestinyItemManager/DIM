(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimSimpleItem', dimItem);

  function dimItem() {
    return {
      replace: true,
      scope: {
        item: '=itemData'
      },
      restrict: 'E',
      templateUrl: 'scripts/store/dimSimpleItem.directive.html',
      bindToController: true,
      controllerAs: 'vm',
      controller: dimItemSimpleCtrl
    };
  }

  dimItemSimpleCtrl.$inject = [];

  function dimItemSimpleCtrl() {
    // nothing to do here...only needed for bindToController
  }
})();
