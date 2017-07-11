import angular from 'angular';
import _ from 'underscore';
import template from './random-loadout.html';
import './random-loadout.scss';

export const RandomLoadoutComponent = {
  template,
  controller: RandomLoadoutCtrl
};

function RandomLoadoutCtrl($window, $scope, dimStoreService, dimLoadoutService, $i18next) {
  'ngInject';

  const vm = this;

  const deregister = $scope.$on('dim-stores-updated', () => {
    vm.showRandomLoadout = true;
    deregister();
  });

  vm.showRandomLoadout = dimStoreService.getStores().length > 0 ? true : undefined;
  vm.disableRandomLoadout = false;

  vm.applyRandomLoadout = function() {
    if (vm.disableRandomLoadout) {
      return null;
    }

    if (!$window.confirm($i18next.t('Loadouts.Randomize'))) {
      return null;
    }

    vm.disableRandomLoadout = true;

    const store = dimStoreService.getActiveStore();
    if (!store) {
      return null;
    }

    const checkClassType = function(classType) {
      return ((classType === 3) || (classType === store.classType));
    };

    const types = [
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
    ];

    const accountItems = dimStoreService.getAllItems().filter((item) => checkClassType(item.classType));
    const items = {};

    const foundExotic = {};

    const fn = (type) => (item) => ((item.type === type) &&
                                    item.equipment &&
                                    (store.level >= item.equipRequiredLevel) &&
                                    (item.typeName !== 'Mask' || ((item.typeName === 'Mask') && (item.tier === 'Legendary'))) &&
                                    (!item.notransfer || (item.notransfer && (item.owner === store.id))) &&
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

