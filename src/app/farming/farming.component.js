import { settings } from '../settings/settings';
import template from './farming.html';
import './farming.scss';

export const FarmingComponent = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(dimFarmingService, dimItemMoveService) {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    service: dimFarmingService,
    settings,
    consolidate: dimItemMoveService.consolidate,
    stop: function($event) {
      $event.preventDefault();
      dimFarmingService.stop();
    }
  });
}
