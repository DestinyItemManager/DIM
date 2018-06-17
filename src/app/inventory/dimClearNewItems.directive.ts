import { settings } from '../settings/settings';
import { NewItemsService } from './store/new-items.service';
import template from './dimClearNewItems.directive.html';
import './dimClearNewItems.scss';
import { IComponentOptions, IController, IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D2StoresService } from './d2-stores.service';
import { D1StoresService } from './d1-stores.service';

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
  hotkeys,
  $i18next
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
      : D1StoresService
    ).getStores();
    NewItemsService.clearNewItems(stores, this.account);
  };
}
