import { settings } from '../settings/settings';
import template from './dimClearNewItems.directive.html';
import './dimClearNewItems.scss';

/**
 * A button that marks all new items as "seen".
 */
export const ClearNewItemsComponent = {
  template,
  controller: ClearNewItemsCtrl,
  bindings: {
    destinyVersion: '<',
    account: '<'
  }
};

function ClearNewItemsCtrl($scope, NewItemsService, D2StoresService, hotkeys, $i18next, dimStoreService) {
  'ngInject';

  this.settings = settings;
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
    const stores = (this.destinyVersion === 2 ? D2StoresService : dimStoreService).getStores();
    NewItemsService.clearNewItems(stores, this.account, this.destinyVersion);
  };
}
