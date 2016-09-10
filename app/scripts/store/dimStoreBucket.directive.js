(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreBucket', StoreBucket)
    .filter('equipped', function() {
      return function(items, isEquipped) {
        return _.select(items || [], function(item) {
          return item.equipped === isEquipped;
        });
      };
    })
    .filter('sortItems', function() {
      return function(items, sort) {
        // Don't resort postmaster items - that way people can see
        // what'll get bumped when it's full.
        if (items.length && items[0].location.inPostmaster) {
          return items;
        }
        items = _.sortBy(items || [], 'name');
        if (sort === 'primaryStat' || sort === 'rarityThenPrimary' || sort === 'quality') {
          items = _.sortBy(items, function(item) {
            return (item.primStat) ? (-1 * item.primStat.value) : 1000;
          });
        }
        if (sort === 'quality') {
          items = _.sortBy(items, function(item) {
            return item.quality && item.quality.min ? -item.quality.min : 1000;
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

  function StoreBucket() {
    return {
      controller: StoreBucketCtrl,
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      restrict: 'E',
      scope: {
        store: '=storeData',
        items: '=bucketItems',
        bucket: '=bucket'
      },
      template: [
        '<div class="sub-section"',
        '     ng-class="[\'sort-\' + vm.bucket.id, { empty: !vm.items.length }]"',
        '     ui-on-drop="vm.onDrop($data, $event, false)" ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)"',
        '     drop-channel="{{::vm.dropChannel}}">',
        '  <div class="equipped sub-bucket" ng-repeat="item in vm.items | equipped:true track by item.index"',
        '       ng-if="!vm.store.isVault"',
        '       ui-on-drop="vm.onDrop($data, $event, true)" ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)"',
        '       drop-channel="{{::vm.dropChannel}}">',
        '    <dim-store-item store-data="vm.store" item-data="item"></dim-store-item>',
        '  </div>',
        '  <div class="unequipped sub-bucket" ui-on-drop="vm.onDrop($data, $event, false)" ',
        '      ui-on-drag-enter="vm.onDragEnter($event)" ui-on-drag-leave="vm.onDragLeave($event)" ',
        '      drop-channel="{{::vm.dropChannel}}">',
        '    <dim-store-item ng-repeat="item in vm.items | equipped:false | sortItems:vm.settings.itemSort track by item.index" store-data="vm.store" item-data="item"></dim-store-item>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StoreBucketCtrl.$inject = ['$scope', 'loadingTracker', 'dimStoreService', 'dimItemService', '$q', '$timeout', 'toaster', 'dimSettingsService', 'ngDialog', '$rootScope', 'dimActionQueue', 'dimInfoService'];

  function StoreBucketCtrl($scope, loadingTracker, dimStoreService, dimItemService, $q, $timeout, toaster, dimSettingsService, ngDialog, $rootScope, dimActionQueue, dimInfoService) {
    var vm = this;

    vm.settings = dimSettingsService;

    vm.dropChannel = vm.bucket.type + ',' + vm.store.id + vm.bucket.type;

    // Detect when we're hovering a dragged item over a target
    var dragTimer = null;
    var hovering = false;
    var dragHelp = document.getElementById('drag-help');
    var entered = 0;
    vm.onDragEnter = function() {
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
    vm.onDragLeave = function() {
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

    // Only show this once per session
    const didYouKnow = _.once(() => {
      dimInfoService.show('doubleclick', {
        title: 'Did you know?',
        body: ['<p>If you\'re moving an item to your currently active (last logged in) character, you can instead double click that item to instantly equip it.</p>',
               '<p>Try it out next time!<p>'].join(''),
        hide: 'Don\'t show this tip again'
      });
    });

    vm.moveDroppedItem = dimActionQueue.wrap(function(item, equip, $event, hovering) {
      var target = vm.store;

      if (target.current && equip) {
        didYouKnow();
      }

      if (item.notransfer && item.owner !== target.id) {
        return $q.reject(new Error('Cannot move that item off this character.'));
      }

      if (item.owner === vm.store.id) {
        if ((item.equipped && equip) || (!item.equipped && !equip)) {
          return $q.resolve(item);
        }
      }

      var promise = $q.when(item.amount);

      if (item.maxStackSize > 1 && item.amount > 1 && ($event.shiftKey || hovering)) {
        ngDialog.closeAll();
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
          className: 'move-amount-popup',
          appendClassName: 'modal-dialog'
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
        return movePromise;
      }).catch(function(e) {
        if (e.message !== 'move-canceled') {
          toaster.pop('error', item.name, e.message);
        }
      });

      loadingTracker.addPromise(promise);

      return promise;
    });
  }
})();
