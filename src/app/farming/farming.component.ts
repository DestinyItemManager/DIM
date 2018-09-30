import { settings } from '../settings/settings';
import template from './farming.html';
import './farming.scss';
import { IComponentOptions } from 'angular';
import { D1FarmingService } from './farming.service';
import { consolidate } from '../inventory/dimItemMoveService.factory';
import store from '../store/store';
import { setSetting } from '../settings/actions';

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
    consolidate,
    makeRoomForItems: settings.farming.makeRoomForItems,
    stop($event) {
      $event.preventDefault();
      D1FarmingService.stop();
    },
    makeRoomForItemsChanged() {
      store.dispatch(
        setSetting('farming', {
          ...settings.farming,
          makeRoomForItems: this.makeRoomForItems
        })
      );
    }
  });
}
