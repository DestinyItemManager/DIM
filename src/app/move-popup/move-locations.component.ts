import { settings } from '../settings/settings';
import template from './move-locations.html';
import './move-locations.scss';
import { IComponentOptions, IController } from 'angular';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { moveItemTo } from '../inventory/dimItemMoveService.factory';

export const MoveLocationsComponent: IComponentOptions = {
  template,
  controller,
  bindings: {
    item: '<',
    amount: '<'
  }
};

function controller(
  this: IController & {
    item: DimItem;
    amount: number;
    store: DimStore;
    stores: DimStore[];
  }
) {
  'ngInject';
  const vm = this;

  vm.settings = settings;

  vm.$onInit = () => {
    const storeService = vm.item.getStoresService();

    vm.store = storeService.getStore(vm.item.owner)!;
    vm.stores = storeService.getStores();
  };

  vm.canShowVault = function canShowVault(buttonStore: DimStore) {
    // If my itemStore is the vault, don't show a vault button.
    // Can't vault a vaulted item.
    if (vm.store.isVault) {
      return false;
    }

    // If my buttonStore is the vault, then show a vault button.
    if (!buttonStore.isVault) {
      return false;
    }

    // Can't move this item away from the current itemStore.
    if (vm.item.notransfer) {
      return false;
    }

    if (vm.item.location.inPostmaster) {
      return false;
    }

    return true;
  };

  vm.canShowStore = function canShowStore(buttonStore: DimStore) {
    // Can't store into a vault
    if (buttonStore.isVault) {
      return false;
    }

    // Can pull items from the postmaster to the same character
    if (vm.item.location.inPostmaster) {
      return vm.store.id === buttonStore.id &&
          vm.item.destinyVersion === 2 &&
          vm.item.canPullFromPostmaster;
    } else if (vm.item.notransfer) {
      // Can store an equiped item in same itemStore
      if (vm.item.equipped && vm.store.id === buttonStore.id) {
        return true;
      }
    } else if (vm.store.id !== buttonStore.id || vm.item.equipped) {
      // In Destiny2, only show one store for account wide items
      if (vm.item.destinyVersion === 2 &&
          vm.item.bucket &&
          vm.item.bucket.accountWide &&
          !buttonStore.current) {
        return false;
      } else {
        return true;
      }
    }

    return false;
  };

  vm.moveItemTo = (store: DimStore, equip: boolean) => {
    moveItemTo(vm.item, store, equip, vm.amount);
  };
}
