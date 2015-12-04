(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreColumn', StoreColumn);

  StoreColumn.$inject = [];

  function StoreColumn() {
    return {
      controller: StoreColumnCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        store: '=dimStore'
      },
      transpile: true,
      template: [
        '<div ng-class="vm.classNames" ng-transclude></div>'
      ].join('')
    }
  }

  StoreColumnCtrl.$inject = ['$scope', 'dimSettingsService'];

  function StoreColumnCtrl($scope, settings) {
    var vm = this;

    $scope.$watch(function() {
      return settings.current;
    }, function(newValue, oldValue) {
      if (vm.store.id === 'vault') {
        delete vm.classNames['dim-col-' + oldValue.vaultCol];
        vm.classNames['dim-col-' + newValue.vaultCol] = newValue.vaultCol;
      } else {
        delete vm.classNames['dim-col-' + oldValue.charCol];
        vm.classNames['dim-col-' + newValue.charCol] = newValue.charCol;
      }
    }, true);
  }

  angular.module('dimApp')
    .directive('dimStores', Stores);

  Stores.$inject = ['ngDialog', 'dimSettingsService'];

  function Stores(ngDialog, settings) {
    return {
      controller: StoresCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div class="container">',
        '  <div class="row">',
        '    <div ng-repeat="store in vm.stores track by store.id" class="col-xs-3 storage" ng-class="vm.getClassNames(store)">',
        '      <div dim-store-heading store-data="store"></div>',
        '    </div>',
        '  </div>',
        '  <div ng-repeat="bucket in vm.itemsByLocation track by bucket.bucketHash" class="row">',
        '    <div class="title col-xs-12">{{ vm.bucketDefinitions[bucket.bucketHash].bucketName }}</div>',
        '    <div ng-repeat="store in bucket.stores track by store.id" class="inventory-item-group storage" ng-class="vm.getClassNames(store)">',
        '      <div class="dim-character-items">',
        '        <div class="equipped" ui-on-drop="vm.onDrop($data, $event, true)" drop-channel="{{ bucket.bucketHash + \',\' + store.id + \'\' + bucket.bucketHash }}">',
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

  StoresCtrl.$inject = ['$scope', 'dimStoreService', '$rootScope', '$q', 'dimItemService', 'toaster', 'dimItemBucketDefinitions', 'dimSettingsService'];

  function StoresCtrl($scope, dimStoreService, $rootScope, $q, dimItemService, toaster, dimItemBucketDefinitions, settings) {
    var vm = this;

    vm.stores = null;
    vm.itemsByLocation = dimStoreService.itemsByLocation;
    dimItemBucketDefinitions.getDefinitions().then(function(defs) {
      vm.bucketDefinitions = defs;
    });

    vm.getClassNames = function getClassNames(store) {
      var className = {
        condensed: settings.current.condensed,
        guardian: store.id !== 'vault',
        vault: store.id === 'vault'
      };

      if (store.id === 'vault') {
        className['dim-col-' + settings.current.vaultCol] = true;
      } else {
        className['dim-col-' + settings.current.charCol] = true;
      }

      return className;
    }

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

    $scope.$on('dim-active-platform-updated', function(e, args) {
      var promise = $q.when(dimStoreService.getStores(true))
        .then(function(stores) {
          vm.stores = stores;
        });

      $rootScope.loadingTracker.addPromise(promise);
    });
  }
})();
