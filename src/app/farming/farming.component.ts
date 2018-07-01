import { settings } from '../settings/settings';
import template from './farming.html';
import './farming.scss';
import { IComponentOptions } from 'angular';
import { D1FarmingService } from './farming.service';
import { consolidate } from '../inventory/dimItemMoveService.factory';

export const FarmingComponent: IComponentOptions = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl() {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    service: D1FarmingService,
    settings,
    consolidate,
    stop($event) {
      $event.preventDefault();
      D1FarmingService.stop();
    }
  });
}
