import template from './refresh.html';

/**
 * The refresh button.
 */
export const RefreshComponent = {
  template,
  controller: RefreshController
};

function RefreshController($rootScope, $scope, loadingTracker, hotkeys, $i18next) {
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
    // Individual pages should listen to this event and decide what to refresh,
    // and their services should decide how to cache/dedup refreshes.
    // This event should *NOT* be listened to by services!
    $rootScope.$broadcast('dim-refresh');
  };
}
