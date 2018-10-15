import { settings } from '../settings/settings';
import template from './vendor-items.html';
import { IComponentOptions, IController, IScope } from 'angular';
import store from '../store/store';
import { toggleCollapsedSection } from '../settings/actions';

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

function VendorItemsCtrl(
  this: IController & {
    settings: typeof settings;
  },
  $scope: IScope
) {
  'ngInject';

  const vm = this;

  $scope.$watch(
    () => settings,
    () => {
      vm.settings = settings;
    }
  );

  vm.toggleSection = (id) => {
    store.dispatch(toggleCollapsedSection(id));
  };
}
