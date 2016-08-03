(function() {
  'use strict';

  /**
   * A button that marks all new items as "seen".
   */
  angular.module('dimApp')
    .component('dimClearNewItems', {
      template: [
        '<div class="clear-new-items" ng-if="$ctrl.storeService.hasNewItems">',
        '  <button ng-click="$ctrl.storeService.clearNewItems()" title="Keyboard shortcut: X"><i class="fa fa-thumbs-up"></i> Clear new items</button>',
        '</div>'
      ].join(''),
      controller: ClearNewItemsCtrl
    });

  ClearNewItemsCtrl.$inject = ['dimStoreService'];
  function ClearNewItemsCtrl(dimStoreService) {
    this.storeService = dimStoreService;
  }
})();
