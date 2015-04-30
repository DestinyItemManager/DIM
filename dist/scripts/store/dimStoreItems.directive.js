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
        '    <div ng-repeat="key in vm.keys" ng-init="value = vm.categories[key]" class="section {{ key.toLowerCase() }}" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ value.join(\',\') }}">',
        '      <div class="title">',
        '        <span>{{ key }}</span>',
        '        <span class="bucket-count" ng-if="vm.store.id === \'vault\'">{{ vm.sortSize[key] }}/{{ key === \'Weapons\' ? 36 : 24 }}  </span>',
        '      </div>',
        '      <div ng-repeat="type in value" class="sub-section sort-{{ type.toLowerCase() }}" ng-class="vm.data[vm.orderedTypes[type]] ? \'\' : \'empty\'">',
        '        <div ng-class="vm.styles[type].equipped" ng-if="vm.store.id !== \'vault\' && vm.data[vm.orderedTypes[type]].equipped" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ value.join(\',\') }}">',
        '          <div ng-repeat="item in vm.data[vm.orderedTypes[type]].equipped track by item.index" dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '        <div ng-class="vm.styles[type].unequipped">',
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

        var srcElement = $window.document.querySelector('#' + id);

        vm.moveDroppedItem(angular.element(srcElement)
          .scope()
          .item, equip);
      };
    }
  }

  StoreItemsCtrl.$inject = ['$scope', 'dimStoreService', 'dimItemService', '$q', '$timeout', 'toaster'];

  function StoreItemsCtrl($scope, dimStoreService, dimItemService, $q, $timeout, toaster) {
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

      promise
        .then(function(s) {
          source = s;
        })
        .then(dimItemService.moveTo.bind(null, item, target, equip))
        .catch(function(a) {
          toaster.pop('error', item.name, a.message);
        });
    };

    $scope.$watch('vm.store.items', function(newVal) {
      vm.data = generateData();

      $timeout(cleanUI, 0);
    }, true);
  }

  function outerHeight(el) {
    var height = el.offsetHeight;
    var style = getComputedStyle(el);

    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    return height;
  }

  function outerWidth(el) {
    var width = el.offsetWidth;
    var style = getComputedStyle(el);

    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
  }

  function cleanUI() {
    var fn = function(memo, section) {
      var childHeight = 0;
      _.each(section.children, function(child) {
        childHeight += outerHeight(child);
      });

      if (childHeight > memo) {
        memo = childHeight;
      }

      return memo;
    };

    var setHeight = function(query) {
      var height = _.reduce(document.querySelectorAll(query), fn, 0);

      var style = document.querySelectorAll('style[id=' + ((query.replace(/\./g, '')).replace(/\s/g, '')) + ']');

      if (style.length > 0) {
        style = style[0];
      } else {
        style = document.createElement('style');
        style.type = 'text/css';
        style.id = (query.replace(/\./g, '')).replace(/\s/g, '');
        document.getElementsByTagName('head')[0].appendChild(style);
      }

      style.innerHTML = query + ' { min-height: ' + (height - 50) + 'px; }';
    };

    setHeight('.guardian .sub-section.sort-primary');
    setHeight('.guardian .sub-section.sort-special');
    setHeight('.guardian .sub-section.sort-heavy');
    setHeight('.guardian .sub-section.sort-helmet');
    setHeight('.guardian .sub-section.sort-chest');
    setHeight('.guardian .sub-section.sort-gauntlets');
    setHeight('.guardian .sub-section.sort-leg');
    setHeight('.guardian .sub-section.sort-classitem');
    setHeight('.guardian .sub-section.sort-emblem');
    setHeight('.guardian .sub-section.sort-armor');
    setHeight('.guardian .sub-section.sort-ghost');
    setHeight('.guardian .sub-section.sort-ship');
    setHeight('.guardian .sub-section.sort-vehicle');
    setHeight('.guardian .sub-section.sort-consumable');
    setHeight('.guardian .weapons');
    setHeight('.guardian .armor');
  }
})();
