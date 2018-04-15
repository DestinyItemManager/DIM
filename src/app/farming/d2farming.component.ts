import { settings } from '../settings/settings';
import template from './d2farming.html';
import './farming.scss';
import { IComponentOptions, IController } from 'angular';

export const D2FarmingComponent: IComponentOptions = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(this: IController, D2FarmingService) {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    service: D2FarmingService,
    settings,
    stop($event) {
      $event.preventDefault();
      D2FarmingService.stop();
    }
  });
}
