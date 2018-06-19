import { settings } from '../settings/settings';
import template from './farming.html';
import './farming.scss';
import { IComponentOptions } from 'angular';
import { D1FarmingService } from './farming.service';

export const FarmingComponent: IComponentOptions = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(dimItemMoveService) {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    service: D1FarmingService,
    settings,
    consolidate: dimItemMoveService.consolidate,
    stop($event) {
      $event.preventDefault();
      D1FarmingService.stop();
    }
  });
}
