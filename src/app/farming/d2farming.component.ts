import { settings } from '../settings/settings';
import template from './d2farming.html';
import './farming.scss';
import { IComponentOptions, IController } from 'angular';
import { D2FarmingService } from './d2farming.service';

export const D2FarmingComponent: IComponentOptions = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(this: IController) {
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
