(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStores', Stores);

  angular.module('dimApp')
    .directive('dimItemType', ItemTypes);

  ItemTypes.$inject = [];

  function ItemTypes() {
    return {
      controller: ['$scope', function($scope) {
        if ($scope.vm.itemsByLocation[$scope.bucket.hash] && $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id]) {
          $scope.equipped = $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id].equipped;
          $scope.unequipped = $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id].unequipped;
        }
      }],
      replace: true,
      template: [
      //'   <div>',
      '      <div class="dim-character-items">',
      '        <div class="equipped" ng-if="equipped.length" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ bucket.hash + \',\' + store.id + \'\' + bucket.hash }}">',
      //'          <div ng-repeat="item in equipped track by item.index" id="{{ item.index }}" ui-draggable="true" drag-channel="{{ (item.notransfer) ? item.owner + \'\' + item.bucket : item.bucket }}" drag="item.index" style="background-image: url(http://www.bungie.net{{ item.icon }})" class="item"></div>',
      '          <div ng-repeat="item in equipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
      '        </div>',
      '        <div ng-class="{unequipped: true || equipped.length}" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ bucket.hash + \',\' + vm.store.id + \'\' + bucket.hash }}">',
      '          <div ng-repeat="item in unequipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
      //'          <div ng-repeat="item in unequipped track by item.index" ui-draggable="true" id="{{ item.index }}" drag-channel="{{ (item.notransfer) ? item.owner + \'\' + item.bucket : item.bucket }}" drag="item.index" style="background-image: url(http://www.bungie.net{{ item.icon }})" class="item"></div>',
      '        </div>',
      '    </div>'].join('')
    };
  }

  Stores.$inject = ['ngDialog'];

  function Stores(ngDialog) {
    return {
      controller: StoresCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div class="container">',
        '  <div class="row">',
        '    <div class="col-xl-3" ng-repeat="store in vm.stores track by store.id" class="storage dim-col-{{ (store.id === \'vault\') ? vm.vaultCol : vm.charCol }}" ng-class="{ condensed: vm.condensed, guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
        '      <div dim-store-heading store-data="store"></div>',
        '    </div>',
        '  </div>',
        '  <div ng-if="vm.stores && vm.hasItems(bucket)" class="row" ng-repeat="bucket in vm.buckets">',
        '    <div class="title col-xl-12" ng-bind="bucket.name"></div>',
        '    <div class="inventory-item-group col-xl-3" ng-repeat="store in vm.stores track by store.id" class="storage" ng-class="{ guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
        '      <div dim-item-type></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', '$rootScope', '$q', 'dimItemService', 'toaster'];

  function StoresCtrl(settings, $scope, dimStoreService, $rootScope, $q, dimItemService, toaster) {
    var vm = this;

    // $scope.$watch(function() {
    //   console.log('Digesting');
    // });

    vm.stores = null;
    vm.itemsByLocation = dimStoreService.itemsByLocation;
    vm.condensed = false;
    vm.charCol = 3;
    vm.vaultCol = 4;

    vm.buckets = [
      { hash: 3284755031, name: 'Subclass' },
      { hash: 1498876634, name: 'Primary' },
      { hash: 2465295065, name: 'Special' },
      { hash: 953998645, name: 'Heavy' },
      { hash: 3448274439, name: 'Helmet' },
      { hash: 3551918588, name: 'Gauntlets' },
      { hash: 14239492, name: 'Chest Armor' },
      { hash: 20886954, name: 'Leg Armor' },
      { hash: 1585787867, name: 'Class Armor' },
      { hash: 4023194814, name: 'Ghosts' },
      { hash: 434908299, name: 'Artifcts' },
      { hash: 4274335291, name: 'Emblems' },
      { hash: 2973005342, name: 'Shaders' },
      { hash: 3054419239, name: 'Emotes' },
      { hash: 284967655, name: 'Ships' },
      { hash: 2025709351, name: 'Vehicles' },
      { hash: 1469714392, name: 'Consumables' },
      { hash: 3865314626, name: 'Materials' },
      { hash: 2197472680, name: 'Bounties' },
      { hash: 1801258597, name: 'Quests' },
      { hash: 375726501, name: 'Missions' },
      { hash: 1367666825, name: 'Speical Orders' },
      { hash: 215593132, name: 'Lost Items' },
      { hash: 2422292810, name: 'Temporary' },
      { hash: 3621873013, name: 'Hidden' }
    ];

    vm.hasItems = function(bucket) {
        return true;
        // TODO: THIS IS SO FREAKING SLOW!!!!!!!!!!!!
//      console.log('Refreshing hasItems for', vm.buckets.length ,'buckets... dimStores.directive.js#L106');
//      for(var s = 0; s < vm.stores.length; s++) {
//        if(vm.itemsByLocation[bucket.hash] && vm.itemsByLocation[bucket.hash][vm.stores[s].id]) {
//          if(vm.itemsByLocation[bucket.hash][vm.stores[s].id].equipped && vm.itemsByLocation[bucket.hash][vm.stores[s].id].unequipped) {
//            return true;
//          }
//        }
//      }
//      return false;
    }

    vm.onDrop = function onDrop(id, $event, equip) {
      var srcElement = $('#' + id);
      var item = angular.element(srcElement[0]).scope().item;
      var store = angular.element($event.currentTarget).scope().store;

      moveDroppedItem(item, store, equip);
    };


    function moveDroppedItem(item, store, equip) {
      var promise = null;
      var target = store;

      if (item.owner === store.id) {
        if ((item.equipped && equip) || (!item.equipped) && (!equip)) {
          return;
        }

        promise = $q.when(store);

      } else {
        promise = $q.when(_.find(vm.stores, function(s) { return s.id === item.owner; }));
        // promise = dimStoreService.getStore(item.owner);
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
        // .then(dimStoreService.getStores)
        // .then(function(stores) {
        //   dimStores = stores;
        //   return dimStoreService.updateStores();
        // })
        // .then(function(bungieStores) {
        //   _.each(dimStores, function(dStore) {
        //     if (dStore.id !== 'vault') {
        //       var bStore = _.find(bungieStores, function(bStore) {
        //         return dStore.id === bStore.id;
        //       });
        //
        //       dStore.level = bStore.base.characterLevel;
        //       dStore.percentToNextLevel = bStore.base.percentToNextLevel;
        //       dStore.powerLevel = bStore.base.characterBase.powerLevel;
        //       dStore.background = bStore.base.backgroundPath;
        //       dStore.icon = bStore.base.emblemPath;
        //     }
        //   })
        // })
        .catch(function(a) {
          toaster.pop('error', item.name, a.message);
        });

      $rootScope.loadingTracker.addPromise(promise);
    };

    // settings.getSettings()
    //   .then(function(settings) {
    //     vm.condensed = settings.condensed;
    //     vm.charCol = (settings.charCol > 2 && settings.charCol < 6) ? settings.charCol : 3;
    //     vm.vaultCol = (settings.vaultCol > 3 && settings.vaultCol < 10) ? settings.vaultCol : 4;
    //   });

    // $rootScope.$on('dim-settings-updated', function(event, arg) {
    //   if (_.has(arg, 'condensed')) {
    //     vm.condensed = arg.condensed;
    //   } else if (_.has(arg, 'charCol')) {
    //     vm.charCol = arg.charCol;
    //   } else if (_.has(arg, 'vaultCol')) {
    //     vm.vaultCol = arg.vaultCol;
    //   }
    // });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      var promise = $q.when(dimStoreService.getStores(true))
        .then(function(stores) {
          vm.stores = stores;
        });

      $rootScope.loadingTracker.addPromise(promise);
    });
  }
})();
