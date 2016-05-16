(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItems', StoreItems)
    .filter('equipped', function() {
      return function(items, isEquipped) {
        return _.select(items || [], function (item) {
          return item.equipped === isEquipped;
        });
      };
    })
    .filter('sortItems', function() {
      return function(items, sort) {
        items = _.sortBy(items || [], 'name');
        if (sort === 'primaryStat' || sort === 'rarityThenPrimary' || sort === 'quality') {
          items = _.sortBy(items, function(item) {
            return (item.primStat) ? (-1 * item.primStat.value) : 1000;
          });
        }
        if (sort === 'quality') {
          items = _.sortBy(items, function(item) {
            return item.quality ? -item.quality : 1000;
          });
        }
        if (sort === 'rarity' || sort === 'rarityThenPrimary') {
          items = _.sortBy(items, function(item) {
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
          });
        }
        return items;
      };
    });

  StoreItems.$inject = ['dimStoreService', '$window'];

  function StoreItems(dimStoreService, $window) {
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
        '  <div class="items {{::vm.store.id }}" data-type="item" data-character="{{::vm.store.id }}">',
        '    <div ng-repeat="(key, value) in ::vm.categories track by key" class="section" ng-class="::key.toLowerCase()">',
        '      <div class="title">',
        '        <span>{{ ::key }}</span>',
        '        <span class="bucket-count" ng-if="::vm.store.id === \'vault\'">{{ vm.sortSize[key] ? vm.sortSize[key] : 0 }}/{{::vm.store.capacityForItem({sort:key})}}  </span>',
        '      </div>',
        '      <div ng-repeat="type in ::value track by type" class="sub-section"',
        '           ng-class="[\'sort-\' + type.replace(\' \', \'-\').toLowerCase(), { empty: !vm.data[type] }]"',
        '           ui-on-drop="vm.onDrop($data, $event, false)" ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)"',
        '           drop-channel="{{:: type + \',\' + vm.store.id + type }}">',
        '        <div class="equipped equippable"',
        '             ng-if="::vm.store.id !== \'vault\'"',
        '             ui-on-drop="vm.onDrop($data, $event, true)" ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)"',
        '              drop-channel="{{:: type + \',\' + vm.store.id + type }}">',
        '          <div ng-repeat="item in vm.data[type] | equipped:true track by item.index" dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '        <div class="unequipped equippable" ui-on-drop="vm.onDrop($data, $event, false)" ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)" drop-channel="{{ type + \',\' + vm.store.id + type }}">',
        '          <div ng-repeat="item in vm.data[type] | equipped:false | sortItems:vm.itemSort track by item.index" dim-store-item store-data="vm.store" item-data="item"></div>',
        '          <div class="item-target"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }


  StoreItemsCtrl.$inject = ['$scope', 'loadingTracker', 'dimStoreService', 'dimItemService', '$q', '$timeout', 'toaster', 'dimSettingsService', 'ngDialog', '$rootScope', 'dimActionQueue', 'dimCategory', 'dimInfoService'];

  function StoreItemsCtrl($scope, loadingTracker, dimStoreService, dimItemService, $q, $timeout, toaster, dimSettingsService, ngDialog, $rootScope, dimActionQueue, dimCategory, dimInfoService) {
    var vm = this;

    // Detect when we're hovering a dragged item over a target
    var dragTimer = null;
    var hovering = false;
    var dragHelp = document.getElementById('drag-help');
    var entered = 0;
    vm.onDragEnter = function($event) {
      if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
        entered = entered + 1;
        if (entered === 1) {
          dragTimer = $timeout(function() {
            if ($rootScope.dragItem) {
              hovering = true;
              dragHelp.classList.add('drag-dwell-activated');
            }
          }, 1000);
        }
      }
    };
    vm.onDragLeave = function($event) {
      if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
        entered = entered - 1;
        if (entered === 0) {
          hovering = false;
          dragHelp.classList.remove('drag-dwell-activated');
          $timeout.cancel(dragTimer);
        }
      }
    };
    vm.onDrop = function(id, $event, equip) {
      vm.moveDroppedItem(angular.element('#' + id).scope().item, equip, $event, hovering);
      hovering = false;
      dragHelp.classList.remove('drag-dwell-activated');
      $timeout.cancel(dragTimer);
    };

    vm.sortSize = _.countBy(vm.store.items, 'sort');

    vm.categories = angular.copy(dimCategory); // Grouping of the types in the rows.

    vm.moveDroppedItem = dimActionQueue.wrap(function(item, equip, $event, hovering) {
      var target = vm.store;

      if (item.notransfer && item.owner !== target.id) {
        return $q.reject(new Error('Cannot move that item off this character.'));
      }

      if (item.owner === vm.store.id) {
        if ((item.equipped && equip) || (!item.equipped) && (!equip)) {
          return $q.resolve(item);
        }
      }

      var promise = $q.when(item.amount);

      if (item.maxStackSize > 1 && item.amount > 1 && ($event.shiftKey || hovering)) {
        var dialogResult = ngDialog.open({
          // TODO: break this out into a separate service/directive?
          template: [
            '<div>',
            '  <h1>',
            '    <dim-simple-item item-data="vm.item"></dim-simple-item>',
            '    How much {{vm.item.name}} to move?',
            '  </h1>',
            '  <div class="ngdialog-inner-content">',
            '    <form ng-submit="vm.finish()">',
            '      <dim-move-amount amount="vm.moveAmount" maximum="vm.maximum"></dim-move-amount>',
            '    </form>',
            '    <div class="buttons"><button ng-click="vm.finish()">Move</button></buttons>',
            '  </div>',
            '</div>'].join(''),
          scope: $scope,
          controllerAs: 'vm',
          controller: ['$scope', function($scope) {
            var vm = this;
            vm.item = $scope.ngDialogData;
            vm.moveAmount = vm.item.amount;
            vm.maximum = dimStoreService.getStore(vm.item.owner).amountOfItem(item);
            vm.finish = function() {
              $scope.closeThisDialog(vm.moveAmount);
            };
          }],
          plain: true,
          data: item,
          appendTo: 'body',
          overlay: true,
          className: 'move-amount-popup'
        });

        promise = dialogResult.closePromise.then(function(data) {
          if (typeof data.value === 'string') {
            return $q.reject(new Error("move-canceled"));
          }
          var moveAmount = data.value;
          return moveAmount;
        });
      }

      promise = promise.then(function(moveAmount) {
        var movePromise = dimItemService.moveTo(item, target, equip, moveAmount);

        var reload = item.equipped || equip;
        if (reload) {
          movePromise = movePromise.then(function() {
            return dimStoreService.updateCharacters();
          });
        }
        return movePromise.then(function() {
          dimStoreService.setHeights();
        });
      }).catch(function(e) {
        if (e.message !== 'move-canceled') {
          toaster.pop('error', item.name, e.message);
        }
      });

      loadingTracker.addPromise(promise);

      return promise;
    });

    function resetData() {
      if (_.any(vm.store.items, {type: 'Unknown'})) {
        vm.categories['Unknown'] = ['Unknown'];
      }

      if (vm.store.isVault) {
        vm.sortSize = _.countBy(vm.store.items, 'sort');
      }

      vm.data = _.groupBy(vm.store.items, function(item) {
        return item.type;
      });

      if(_.where(vm.store.items, {type: 'Lost Items'}).length >= 20) {
        dimInfoService.show('lostitems', {
          type: 'warning',
          title: 'Postmaster Limit',
          body: 'There are 20 lost items at the Postmaster on the ' + vm.store.name + '. Any new items will overwrite the existing.',
          hide: 'Never show me this type of warning again.'
        });
      }
    }


    dimSettingsService.getSetting('itemSort').then(function(sort) {
      vm.itemSort = sort;
    });

    $scope.$on('dim-settings-updated', function(event, settings) {
      if (_.has(settings, 'itemSort')) {
        vm.itemSort = settings.itemSort;
      }
      if (_.has(settings, 'charCol') || _.has(settings, 'vaultCol')) {
        dimStoreService.setHeights();
      }
    });

    $scope.$watchCollection('vm.store.items', resetData);
  }
})();
