import angular from 'angular';
import template from './dimFarming.directive.html';

angular.module('dimApp').directive('dimFarming', Farming);

function Farming() {
  return {
    controller: FarmingCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    template: template
  };
}

function FarmingCtrl(dimFarmingService, dimItemMoveService, dimSettingsService) {
  const vm = this;

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
