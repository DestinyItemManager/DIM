import angular from 'angular';
import _ from 'underscore';
import template from './random-loadout.html';
import './random-loadout.scss';

export const RandomLoadoutComponent = {
  template,
  controller: RandomLoadoutCtrl,
  bindings: {
    stores: '<'
  }
};

function RandomLoadoutCtrl($window, $scope, dimStoreService, D2StoresService, dimLoadoutService, $i18next) {
  'ngInject';

  const vm = this;

  vm.$onChanges = function() {
    if (vm.stores && vm.stores.length) {
      vm.showRandomLoadout = true;
    }
  };
  vm.disableRandomLoadout = false;

  vm.applyRandomLoadout = function() {
    if (vm.disableRandomLoadout) {
      return null;
    }

    if (!$window.confirm($i18next.t('Loadouts.Randomize'))) {
      return null;
    }

    vm.disableRandomLoadout = true;

    const store = _.find(vm.stores, 'current');
    if (!store) {
      return null;
    }

    const types = store.destinyVersion === 1 ? [
      'Class',
      'Primary',
      'Special',
      'Heavy',
      'Helmet',
      'Gauntlets',
      'Chest',
      'Leg',
      'ClassItem',
      'Artifact',
      'Ghost'
    ] : [
      'Class',
      'Kinetic',
      'Energy',
      'Power',
      'Helmet',
      'Gauntlets',
      'Chest',
      'Leg',
      'ClassItem',
      'Ghost',
    ];

    const accountItems = (store.destinyVersion === 2 ? D2StoresService : dimStoreService).getAllItems();
    const items = {};

    const foundExotic = {};

    const fn = (type) => (item) => (item.type === type &&
                                    item.canBeEquippedBy(store) &&
                                    (item.typeName !== 'Mask' || ((item.typeName === 'Mask') && (item.tier === 'Legendary'))) &&
                                    (!foundExotic[item.bucket.sort] || (foundExotic[item.bucket.sort] && !item.isExotic)));

    _.each(types, (type) => {
      const filteredItems = _.filter(accountItems, fn(type));
      const random = filteredItems[Math.floor(Math.random() * filteredItems.length)];

      if (!foundExotic[random.bucket.sort]) {
        foundExotic[random.bucket.sort] = random.isExotic;
      }

      const clone = angular.extend(angular.copy(random), { equipped: true });
      items[type.toLowerCase()] = [clone];
    });

    return dimLoadoutService
      .applyLoadout(store, {
        classType: -1,
        name: $i18next.t('Loadouts.Random'),
        items: items
      }, true)
      .finally(() => {
        vm.disableRandomLoadout = false;
      });
  };
}

