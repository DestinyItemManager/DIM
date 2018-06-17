import { optimalLoadout } from '../loadout-utils';
import template from './random-loadout.html';
import './random-loadout.scss';
import { IComponentOptions, IController, IWindowService } from 'angular';
import { DimStore } from '../../inventory/store-types';

export const RandomLoadoutComponent: IComponentOptions = {
  template,
  controller: RandomLoadoutCtrl,
  bindings: {
    stores: '<'
  }
};

function RandomLoadoutCtrl(
  this: IController & {
    stores: DimStore[];
  },
  $window: IWindowService,
  dimLoadoutService,
  $i18next
) {
  'ngInject';

  const vm = this;

  vm.$onChanges = () => {
    if (vm.stores && vm.stores.length) {
      vm.showRandomLoadout = true;
    }
  };
  vm.disableRandomLoadout = false;

  vm.applyRandomLoadout = (e) => {
    e.preventDefault();

    if (vm.disableRandomLoadout || !$window.confirm($i18next.t('Loadouts.Randomize'))) {
      return null;
    }

    const store = vm.stores.find((s) => s.current);
    if (!store) {
      return null;
    }

    const types = new Set([
      'Class',
      'Primary',
      'Special',
      'Heavy',
      'Kinetic',
      'Energy',
      'Power',
      'Helmet',
      'Gauntlets',
      'Chest',
      'Leg',
      'ClassItem',
      'Artifact',
      'Ghost'
    ]);
    const storeService = store.getStoresService();

    // Any item equippable by this character in the given types
    const applicableItems = storeService.getAllItems().filter((i) => types.has(i.type) && i.canBeEquippedBy(store));

    // Use "random" as the value function
    const loadout = optimalLoadout(applicableItems, () => Math.random(), $i18next.t('Loadouts.Random'));

    vm.disableRandomLoadout = true;
    return dimLoadoutService
      .applyLoadout(store, loadout, true)
      .finally(() => {
        vm.disableRandomLoadout = false;
      });
  };
}
