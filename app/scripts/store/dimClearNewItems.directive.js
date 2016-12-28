(function() {
  'use strict';

  /**
   * A button that marks all new items as "seen".
   */
  angular.module('dimApp')
    .component('dimClearNewItems', {
      templateUrl: 'scripts/store/dimClearNewItems.directive.html',
      controller: ClearNewItemsCtrl
    });

  ClearNewItemsCtrl.$inject = ['dimStoreService', 'dimSettingsService'];
  function ClearNewItemsCtrl(dimStoreService, dimSettingsService) {
    this.storeService = dimStoreService;
    this.settings = dimSettingsService;
  }
})();
