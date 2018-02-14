import _ from 'underscore';
import { optimalLoadout } from '../loadout-utils';
import template from './random-loadout.html';
import './random-loadout.scss';

export const RandomLoadoutComponent = {
  template,
  controller: RandomLoadoutCtrl,
  bindings: {
    stores: '<'
  }
};

function RandomLoadoutCtrl($window, dimStoreService, D2StoresService, dimLoadoutService, $i18next) {
  'ngInject';

  const vm = this;

  vm.$onChanges = function() {
    if (vm.stores && vm.stores.length) {
      vm.showRandomLoadout = true;
    }
  };
  vm.disableRandomLoadout = false;

  vm.applyRandomLoadout = function(e) {
    e.preventDefault();

    if (vm.disableRandomLoadout || !$window.confirm($i18next.t('Loadouts.Randomize'))) {
      return null;
    }

    const store = _.find(vm.stores, 'current');
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
    const storeService = (store.destinyVersion === 2 ? D2StoresService : dimStoreService);

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

