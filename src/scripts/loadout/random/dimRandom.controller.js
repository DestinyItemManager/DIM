import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .controller('dimRandomCtrl', dimRandomCtrl);


function dimRandomCtrl($window, $scope, $q, dimStoreService, dimLoadoutService, $translate) {
  var vm = this;

  $scope.$on('dim-stores-updated', function() {
    vm.showRandomLoadout = true;
  });

  vm.showRandomLoadout = false;
  vm.disableRandomLoadout = false;

  vm.applyRandomLoadout = function() {
    if (vm.disableRandomLoadout) {
      return;
    }

    if (!$window.confirm($translate.instant('Loadouts.Randomize'))) {
      return;
    }

    vm.disableRandomLoadout = true;

    $q.when(dimStoreService.getStores())
      .then((stores) => {
        const store = _.reduce(stores, (memo, store) => {
          if (!memo) {
            return store;
          }
          const d1 = new Date(store.lastPlayed);

          return (d1 >= memo) ? store : memo;
        }, null);

        if (store) {
          const classTypeId = ({
            titan: 0,
            hunter: 1,
            warlock: 2
          })[store.class];

          var checkClassType = function(classType) {
            return ((classType === 3) || (classType === classTypeId));
          };

          var types = ['Class',
            'Primary',
            'Special',
            'Heavy',
            'Helmet',
            'Gauntlets',
            'Chest',
            'Leg',
            'ClassItem',
            'Artifact',
            'Ghost'];

          let accountItems = [];
          var items = {};

          _.each(stores, (store) => {
            accountItems = accountItems.concat(_.filter(store.items, (item) => checkClassType(item.classType)));
          });

          var foundExotic = {};

          var fn = (type) => (item) => ((item.type === type) &&
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

          return dimLoadoutService.applyLoadout(store, {
            classType: -1,
            name: $translate.instant('Loadouts.Random'),
            items: items
          }, true);
        }
        return null;
      })
      .then(() => {
        vm.disableRandomLoadout = false;
      })
      .catch(() => {
        vm.disableRandomLoadout = false;
      });
  };
}

