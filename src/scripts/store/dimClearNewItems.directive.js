import angular from 'angular';
import template from './dimClearNewItems.directive.html';
/**
 * A button that marks all new items as "seen".
 */
angular.module('dimApp')
  .component('dimClearNewItems', {
    template: template,
    controller: ClearNewItemsCtrl
  });

function ClearNewItemsCtrl(dimStoreService, dimSettingsService) {
  this.storeService = dimStoreService;
  this.settings = dimSettingsService;
}
