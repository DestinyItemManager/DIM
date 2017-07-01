import angular from 'angular';
import template from './farming.html';
import './farming.scss';

export const FarmingComponent = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(dimFarmingService, dimItemMoveService, dimSettingsService) {
  'ngInject';

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
