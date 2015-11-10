(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStores', Stores);

  // angular.module('dimApp')
  //   .directive('dimItemType', ItemTypes);

  // ItemTypes.$inject = [];
  //
  // function ItemTypes() {
  //   return {
  //     controller: ['$scope', function($scope) {
  //       if ($scope.vm.itemsByLocation[$scope.bucket.hash] && $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id]) {
  //         $scope.equipped = $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id].equipped;
  //         $scope.unequipped = $scope.vm.itemsByLocation[$scope.bucket.hash][$scope.store.id].unequipped;
  //       }
  //     }],
  //     replace: true,
  //     template: [
  //       '<div class="dim-character-items">',
  //       '  <div class="equipped" ng-if="equipped.length" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ bucket.bucketHash + \',\' + store.id + \'\' + bucket.bucketHash }}">',
  //       '    <div ng-repeat="item in equipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
  //       '  </div>',
  //       '  <div ng-class="{unequipped: true || equipped.length}" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ bucket.bucketHash + \',\' + store.id + \'\' + bucket.bucketHash }}">',
  //       '    <div ng-repeat="item in unequipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
  //       '  </div>',
  //       '</div>'
  //     ].join('')
  //   };
  // }

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
        '  <div ng-repeat="bucket in vm.itemsByLocation track by bucket.bucketHash" class="row">',
        '    <div class="title col-xs-12">{{ vm.bucketDefinitions[bucket.bucketHash].bucketName }}</div>',
        '    <div class="inventory-item-group col-xl-3" ng-repeat="store in bucket.stores track by store.id" class="storage" ng-class="{ guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
        '      <div class="dim-character-items">',
        '        <div class="equipped" ng-if="store.items.equipped.length" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ bucket.bucketHash + \',\' + store.id + \'\' + bucket.bucketHash }}">',
        '          <div ng-repeat="item in store.items.equipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
        '        </div>',
        '        <div ng-class="{unequipped: store.items.equipped.length}" ui-on-drop="vm.onDrop($data, $event, false)" drop-channel="{{ bucket.bucketHash + \',\' + store.id + \'\' + bucket.bucketHash }}">',
        '          <div ng-repeat="item in store.items.unequipped track by item.index" dim-store-item store-data="store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', '$rootScope', '$q', 'dimItemService', 'toaster', 'dimItemBucketDefinitions'];

  function StoresCtrl(settings, $scope, dimStoreService, $rootScope, $q, dimItemService, toaster, dimItemBucketDefinitions) {
    var vm = this;

    vm.stores = null;
    vm.itemsByLocation = dimStoreService.itemsByLocation;
    dimItemBucketDefinitions.getDefinitions().then(function(defs) {
      vm.bucketDefinitions = defs;
    });
    vm.condensed = false;
    vm.charCol = 3;
    vm.vaultCol = 4;

    vm.onDrop = function onDrop(id, $event, equip) {
      var srcElement = $('#' + id);
      var item = angular.element(srcElement[0]).scope().item;
      var store = angular.element($event.currentTarget).scope().store;

      dimStoreService.getStore(store.id).then(
        function(store) {
          moveDroppedItem(item, store, equip);
        }
      );
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
        promise = $q.when(_.find(vm.stores, function(s) {
          return s.id === item.owner;
        }));
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
