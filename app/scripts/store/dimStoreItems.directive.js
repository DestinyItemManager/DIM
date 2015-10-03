(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItems', StoreItems);

  StoreItems.$inject = ['dimStoreService', '$window'];

  function StoreItems(dimStoreService, $window) {
    return {
      controller: StoreItemsCtrl,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
        '  <div class="items {{ vm.store.id }}" data-type="item" data-character="{{ vm.store.id }}">',
        '    <div ng-repeat="key in vm.keys" ng-init="value = vm.categories[key]" class="section {{ key.toLowerCase() }}">',
        '      <div class="title">',
        '        <span>{{ ::key }}</span>',
        '        <span class="bucket-count" ng-if="vm.store.id === \'vault\'">{{ vm.sortSize[key] ? vm.sortSize[key] : 0 }}/{{ (key === \'Weapons\' || key === \'Armor\') ? 72 : 36 }}  </span>',
        '      </div>',
        '      <div ng-repeat="type in value" class="sub-section sort-{{ type.replace(\' \', \'-\').toLowerCase() }}" ng-class="vm.data[vm.orderedTypes[type]] ? \'\' : \'empty\'" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ type + \',\' + vm.store.id + type }}">',
        '        <div ng-class="vm.styles[type.replace(\' \', \'-\')].equipped" ng-if="vm.store.id !== \'vault\'" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ type + \',\' + vm.store.id + type }}">',
        '          <div ng-repeat="item in vm.data[vm.orderedTypes[type]].equipped track by item.index" dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '        <div ng-class="vm.styles[type.replace(\' \', \'-\')].unequipped" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ type + \',\' + vm.store.id + type }}">',
        '          <div ng-repeat="item in vm.data[vm.orderedTypes[type]].unequipped track by item.index" dim-store-item store-data="vm.store" item-data="item"></div>',
        '          <div class="item-target"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      scope.vm.onDrop = function(id, $event, equip) {
        var vm = scope.vm;

        var srcElement = $('#' + id);

        vm.moveDroppedItem(angular.element(srcElement[0])
          .scope()
          .item, equip);
      };
    }
  }

  StoreItemsCtrl.$inject = ['$scope', '$rootScope', 'dimStoreService', 'dimItemService', '$q', '$timeout', 'toaster', 'dimSettingsService'];

  function StoreItemsCtrl($scope, $rootScope, dimStoreService, dimItemService, $q, $timeout, toaster, dimSettingsService) {
    var vm = this;


    var types = [ // Order of types in the rows.
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
      'Ghost',
      'Emblem',
      'Armor',
      'Ship',
      'Vehicle',
      'Emote',
      'Consumable',
      'Material',
      'Missions',
      'Bounties',
      'Messages',
      'Special Orders',
      'Lost Items'
    ];
    vm.orderedTypes = {};

    _.each(types, function(value, index) {
      vm.orderedTypes[value] = index;
    });

    vm.sortSize = _(vm.store.items)
      .chain()
      .groupBy(function(i) {
        return i.sort;
      })
      .mapObject(function(val, key) {
        return _.size(val);
      })
      .value();

    vm.categories = { // Grouping of the types in the rows.
      Weapons: [
        'Class',
        'Primary',
        'Special',
        'Heavy',
      ],
      Armor: [
        'Helmet',
        'Gauntlets',
        'Chest',
        'Leg',
        'ClassItem'
      ],
      General: [
        'Artifact',
        'Ghost',
        'Consumable',
        'Material',
        'Emblem',
        'Armor',
        'Emote',
        'Ship',
        'Vehicle',
        'Missions',
        'Bounties'
      ],
      Postmaster: [
        'Messages',
        'Special Orders',
        'Lost Items'
      ]
    };

    vm.keys = _.keys(vm.categories);

    vm.styles = { // Styles of the types in the rows.
      Class: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Primary: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Special: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Heavy: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Helmet: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Gauntlets: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Chest: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Leg: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      ClassItem: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Artifact: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Emblem: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Armor: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Emote: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Ghost: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Ship: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Vehicle: {
        equipped: 'equipped equippable',
        unequipped: 'unequipped equippable',
      },
      Consumable: {
        equipped: '',
        unequipped: 'unequipped equippable',
      },
      Material: {
        equipped: '',
        unequipped: 'unequipped equippable',
      },
      Messages: {
        equipped: '',
        unequipped: 'unequipped equippable',
      },
      'Special-Orders': {
        equipped: '',
        unequipped: 'unequipped equippable',
      },
      'Lost-Items': {
        equipped: '',
        unequipped: 'unequipped equippable',
      }
    };

    function generateData() {
      return dimSettingsService.getSetting('itemSort')
        .then(function(sort) {
          if (vm.store.id === 'vault') {
            vm.sortSize = _(vm.store.items)
              .chain()
              .groupBy(function(i) {
                return i.sort;
              })
              .mapObject(function(val, key) {
                return _.size(val);
              })
              .value();
          }

          return _.chain(vm.store.items)
            .sortBy(function(item) {
              return item.name;
            })
            .sortBy(function(item) {
              if (sort === 'rarity') {
                switch (item.tier) {
                  case 'Exotic':
                    return 0;
                  case 'Legendary':
                    return 1;
                  case 'Rare':
                    return 2;
                  case 'Uncommon':
                    return 3;
                  case 'Common':
                    return 4;
                  default:
                    return 5;
                }
              } else {
                return ((item.primStat) ? -1 * item.primStat.value : 1000);
              }
            })
            .sortBy(function(item) {
              return vm.orderedTypes[item.type];
            })
            .groupBy(function(item) {
              return vm.orderedTypes[item.type];
            })
            .mapObject(function(values, key) {
              return _.groupBy(values, function(item) {
                return (item.equipped ? 'equipped' : 'unequipped');
              });
            })
            .value();
        });
    }

    vm.moveDroppedItem = function(item, equip) {
      var promise = null;
      var target = vm.store;

      if (item.owner === vm.store.id) {
        if ((item.equipped && equip) || (!item.equipped) && (!equip)) {
          return;
        }

        promise = $q.when(vm.store);

      } else {
        promise = dimStoreService.getStore(item.owner);
      }

      var source;

      if (item.notransfer && item.owner !== target.id) {
        return $q.reject(new Error('Cannot move class to different store.'));
      }

      var dimStores = null;

      promise = promise
        .then(function(s) {
          source = s;
        })
        .then(dimItemService.moveTo.bind(null, item, target, equip))
        .then(dimStoreService.getStores)
        .then(function(stores) {
          dimStores = stores;
          return dimStoreService.updateStores();
        })
        .then(function(bungieStores) {
          _.each(dimStores, function(dStore) {
            if (dStore.id !== 'vault') {
              var bStore = _.find(bungieStores, function(bStore) {
                return dStore.id === bStore.id;
              });

              dStore.level = bStore.base.characterLevel;
              dStore.percentToNextLevel = bStore.base.percentToNextLevel;
              dStore.powerLevel = bStore.base.characterBase.powerLevel;
              dStore.background = bStore.base.backgroundPath;
              dStore.icon = bStore.base.emblemPath;
            }
          })
        })
        .catch(function(a) {
          toaster.pop('error', item.name, a.message);
        });

      $rootScope.loadingTracker.addPromise(promise);
    };

    function resetData() {
        generateData()
          .then(function(data) {
            vm.data = data;
            $timeout(dimStoreService.setHeights, 0);
          });
    }

    var debounceResetData = _.debounce(resetData, 500);

    $scope.$watch('vm.store.items', function(newVal) {
      resetData();
    }, true);
  }
})();
