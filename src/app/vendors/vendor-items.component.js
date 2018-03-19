import { settings } from '../settings/settings';
import template from './vendor-items.html';

export const VendorItems = {
  controller: VendorItemsCtrl,
  bindings: {
    vendors: '=vendorsData',
    types: '<displayTypes',
    totalCoins: '<',
    activeTab: '<',
    extraMovePopupClass: '<'
  },
  template: template
};

function VendorItemsCtrl() {
  'ngInject';

  const vm = this;

  vm.settings = settings;

  vm.toggleSection = function(id) {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };
}
