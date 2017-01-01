(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimDebugItemCtrl', dimDebugItemCtrl);

  function dimDebugItemCtrl($scope, $state, dimStoreService, dimItemService, dimDefinitions, $stateParams, dimFeatureFlags) {
    const vm = this;
    dimFeatureFlags.debugMode = true; // if you got here, turn on debug mode

    function init() {
      dimDefinitions.then((defs) => {
        vm.fullItem = dimItemService.getItem({ id: $stateParams.itemId });
        if (!vm.fullItem) {
          return;
        }
        vm.item = angular.copy(vm.fullItem);
        vm.originalItem = vm.item.originalItem;
        vm.definition = defs.InventoryItem[vm.item.hash];
        delete vm.item.originalItem;

        vm.store = dimStoreService.getStore(vm.item.owner);
      });
    }

    $scope.$on('dim-stores-updated', function(e) {
      init();
    });
  }
})();
