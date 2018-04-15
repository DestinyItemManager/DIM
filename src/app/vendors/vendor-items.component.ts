import { settings } from '../settings/settings';
import template from './vendor-items.html';
import { IComponentOptions } from 'angular';

export const VendorItems: IComponentOptions = {
  controller: VendorItemsCtrl,
  bindings: {
    vendors: '=vendorsData',
    types: '<displayTypes',
    totalCoins: '<',
    activeTab: '<',
    extraMovePopupClass: '<'
  },
  template
};

function VendorItemsCtrl() {
  'ngInject';

  const vm = this;

  vm.settings = settings;

  vm.toggleSection = (id) => {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };
}
