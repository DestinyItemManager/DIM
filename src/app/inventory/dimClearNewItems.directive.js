import template from './dimClearNewItems.directive.html';
import './dimClearNewItems.scss';

/**
 * A button that marks all new items as "seen".
 */
export const ClearNewItemsComponent = {
  template,
  controller: ClearNewItemsCtrl,
  bindings: {
    destinyVersion: '<'
  }
};

function ClearNewItemsCtrl($scope, NewItemsService, dimSettingsService, D2StoresService, hotkeys, $i18next, dimStoreService) {
  'ngInject';

  this.settings = dimSettingsService;
  this.newItemsService = NewItemsService;

  hotkeys = hotkeys.bindTo($scope);

  hotkeys.add({
    combo: ['x'],
    description: $i18next.t('Hotkey.ClearNewItems'),
    callback: function() {
      NewItemsService.clearNewItems();
    }
  });

  this.clearNewItems = function() {
    NewItemsService.clearNewItems((this.destinyVersion === 2 ? D2StoresService : dimStoreService).getStores());
  };
}
