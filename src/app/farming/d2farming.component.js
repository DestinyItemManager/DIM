import { settings } from '../settings/settings';
import template from './d2farming.html';
import './farming.scss';

export const D2FarmingComponent = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(D2FarmingService) {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    service: D2FarmingService,
    settings,
    stop: function($event) {
      $event.preventDefault();
      D2FarmingService.stop();
    }
  });
}
