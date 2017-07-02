import template from './refresh-stores.html';

/**
 * The refresh button.
 */
export const RefreshStoresComponent = {
  template,
  controller: RefreshStoresController
};

function RefreshStoresController($scope, loadingTracker, hotkeys, dimStoreService, $i18next) {
  'ngInject';

  const vm = this;
  vm.loadingTracker = loadingTracker;

  hotkeys = hotkeys.bindTo($scope);

  hotkeys.add({
    combo: ['r'],
    description: $i18next.t('Hotkey.RefreshInventory'),
    callback: function() {
      vm.refresh();
    }
  });

  vm.refresh = function() {
    loadingTracker.addPromise(dimStoreService.reloadStores());
  };
}
