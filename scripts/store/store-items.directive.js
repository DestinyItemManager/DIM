/*jshint -W027*/

(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItems', StoreItems);

  function StoreItems() {
    return {
      controller: StoreItemsCtrl,
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
        '  <div class="items {{ vm.store.id }}" data-type="item" data-character="{{ vm.store.id }}">',
        '    <div ng-repeat="(key, value) in vm.categories" class="section {{ key.toLowerCase() }}" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ value.join(\',\') }}">',
        '      <div class="title">',
        '        <span>{{ key }}</span>',
        '        <span class="bucket-count" ng-if="vm.store.id === \'vault\'">{{ vm.store.bucketCounts[key] }}/20</span>',
        '      </div>',
        '      <div ng-repeat="type in value" class="sub-section sort-{{ type.toLowerCase() }}" ng-class="vm.data[vm.orderedTypes[type]] ? \'\' : \'empty\'">',
        '        <div ng-class="vm.styles[type].equipped" ng-if="vm.store.id !== \'vault\'" ng-if="vm.data[vm.orderedTypes[type]].equipped" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ value.join(\',\') }}">',
        '          <div ng-repeat="item in vm.data[vm.orderedTypes[type]].equipped" dim-store-item store-data="vm.store" item-data="item" ng-click="vm.onDrop(item.id, $event, false)"></div>',
        '        </div>',
        '        <div ng-class="vm.styles[type].unequipped">',
        '          <div ng-repeat="item in vm.data[vm.orderedTypes[type]].unequipped" dim-store-item store-data="vm.store" item-data="item"></div>',
        '          <div class="item-target"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    StoreItemsCtrl.$inject = ['$scope', 'dimItemService', 'dimStoreService', '$q', 'dimConfig'];

    function StoreItemsCtrl($scope, dimItemService, dimStoreService, $q, dimConfig) {
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
        'Emblem',
        'Armor',
        'Ghost',
        'Ship',
        'Vehicle',
        'Consumable',
        'Material'
      ];
      vm.orderedTypes = {};

      _.each(types, function (value, index) {
        vm.orderedTypes[value] = index;
      });

      vm.categories = { // Grouping of the types in the rows.
        Weapons: [
          'Primary',
          'Special',
          'Heavy',
        ],
        Armor: [
          'Helmet',
          'Gauntlets',
          'Chest',
          'Leg',
          'ClassItem',
        ],
        General: [
          'Emblem',
          'Armor',
          'Ghost',
          'Ship',
          'Vehicle',
          'Consumable',
          'Material'
        ]
      };

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
        Emblem: {
          equipped: 'equipped equippable',
          unequipped: 'unequipped equippable',
        },
        Armor: {
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
          unequipped: 'unequippable',
        },
        Material: {
          equipped: '',
          unequipped: 'unequippable',
        }
      };

      function generateData() {
        return _.chain(vm.store.items)
          .sortBy(function (item) {
            return vm.orderedTypes[item.type];
          })
          .groupBy(function (item) {
            return vm.orderedTypes[item.type];
          })
          .mapObject(function (values, key) {
            return _.groupBy(values, function (item) {
              return (item.equipped ? 'equipped' : 'unequipped');
            });
          })
          .value();
      }

      vm.data = generateData();

      vm.onDrop = function (id, e, equip) {
        var item = dimItemService.getItem(id);
        var source = null;

        if (item.owner === vm.store.id) {
          source = vm.store;
        } else {
          source = dimStoreService.getStore(item.owner);
        }

        dimItemService.moveTo(item, vm.store, equip)
          .catch(function (error) {
            if (dimConfig.debug) {
              console.log('error: ' + error);
            }
          })
          .finally(function (result) {
            if (dimConfig.debug) {
              console.log('done.');
              console.log('------');
            }
          });
      };

      function updateUi(item, source, target) {
        return $q(function (resolve, reject) {
          var index = _.findIndex(source.items, function (prevItems) {
            return item.id == prevItems.id;
          });

          if (index >= 0) {
            source.items.splice(index, 1);
            target.items.push(item);
          }
        });
      }

      // $scope.$watch('vm.store.items', function (newVal) {
      //   vm.data = _.chain(vm.store.items)
      //     .sortBy(function (item) {
      //       return vm.orderedTypes[item.type];
      //     })
      //     .groupBy(function (item) {
      //       return vm.orderedTypes[item.type];
      //     })
      //     .mapObject(function (values, key) {
      //       return _.groupBy(values, function (item) {
      //         return (item.equipped ? 'equipped' : 'unequipped');
      //       });
      //     })
      //     .value();
      // });
    }
  }
})();
