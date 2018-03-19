import { settings } from '../settings/settings';
import { NewItemsService } from './store/new-items.service';
import template from './dimClearNewItems.directive.html';
import './dimClearNewItems.scss';

/**
 * A button that marks all new items as "seen".
 */
export const ClearNewItemsComponent = {
  template,
  controller: ClearNewItemsCtrl,
  bindings: {
    account: '<'
  }
};

function ClearNewItemsCtrl($scope, D2StoresService, hotkeys, $i18next, dimStoreService) {
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
    const stores = (this.account.destinyVersion === 2 ? D2StoresService : dimStoreService).getStores();
    NewItemsService.clearNewItems(stores, this.account);
  };
}
