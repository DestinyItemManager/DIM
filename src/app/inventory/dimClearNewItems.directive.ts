import { settings } from '../settings/settings';
import { NewItemsService } from './store/new-items.service';
import template from './dimClearNewItems.directive.html';
import './dimClearNewItems.scss';
import { IComponentOptions, IController, IScope } from 'angular';
import { StoreServiceType } from './d2-stores.service';
import { DestinyAccount } from '../accounts/destiny-account.service';

/**
 * A button that marks all new items as "seen".
 */
export const ClearNewItemsComponent: IComponentOptions = {
  template,
  controller: ClearNewItemsCtrl,
  bindings: {
    account: '<'
  }
};

function ClearNewItemsCtrl(
  this: IController & { account: DestinyAccount },
  $scope: IScope,
  D2StoresService: StoreServiceType,
  hotkeys,
  $i18next,
  dimStoreService: StoreServiceType
) {
  "ngInject";

  const vm = this;

  this.settings = settings;
  this.newItemsService = NewItemsService;

  hotkeys = hotkeys.bindTo($scope);

  hotkeys.add({
    combo: ["x"],
    description: $i18next.t("Hotkey.ClearNewItems"),
    callback() {
      vm.clearNewItems();
    }
  });

  this.clearNewItems = () => {
    const stores = (this.account.destinyVersion === 2
      ? D2StoresService
      : dimStoreService
    ).getStores();
    NewItemsService.clearNewItems(stores, this.account);
  };
}
