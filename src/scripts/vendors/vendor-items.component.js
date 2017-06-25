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

function VendorItemsCtrl(dimSettingsService) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;

  vm.toggleSection = function(id) {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };
}
