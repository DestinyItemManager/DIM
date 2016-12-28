(function() {
  'use strict';

  angular.module('dimApp').directive('dimFarming', Farming);

  function Farming() {
    return {
      controller: FarmingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      templateUrl: 'scripts/store/dimFarming.directive.html'
    };
  }

  FarmingCtrl.$inject = ['dimFarmingService', 'dimItemMoveService', 'dimSettingsService'];

  function FarmingCtrl(dimFarmingService, dimItemMoveService, dimSettingsService) {
    var vm = this;

    angular.extend(vm, {
      service: dimFarmingService,
      settings: dimSettingsService,
      consolidate: dimItemMoveService.consolidate,
      stop: function($event) {
        $event.preventDefault();
        dimFarmingService.stop();
      }
    });
  }
})();
