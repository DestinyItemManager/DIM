import template from './dimClearNewItems.directive.html';

/**
 * A button that marks all new items as "seen".
 */
export const ClearNewItemsComponent = {
  template,
  controller: ClearNewItemsCtrl
};

function ClearNewItemsCtrl($scope, NewItemsService, dimSettingsService, hotkeys, $i18next, dimStoreService) {
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
    NewItemsService.clearNewItems(dimStoreService.getStores());
  };
}
