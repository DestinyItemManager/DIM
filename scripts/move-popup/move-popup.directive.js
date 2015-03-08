(function() {
  'use strict';

  angular.module('dimApp').directive('dimMovePopup', MovePopup);

  function MovePopup($window) {
    return {
      controller: MovePopupController,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      restrict: 'A',
      scope: {
        store: '=dimStore',
        item: '=dimItem'
      },
      replace: true,
      template: [
        '<div class="move-popup">',
          '<div class="locations" ng-repeat="store in vm.stores">',
            '<div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" ',
              'ng-if="vm.canShowButton(vm.item, vm.store, store)" ng-click="MoveToVault(vm.item, store, $event)" ',
              'data-type="item" data-character="{{ store.id }}">',
              '<span>Vault</span>',
            '</div>',
            '<div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" ',
              'ng-if="vm.canShowButton(vm.item, vm.store, store)" ng-click="MoveToGuardian(store, $event)" ',
              'data-type="item" data-character="{{ store.id }} style="background-image: url(http://bungie.net{{ store.icon }})"> ',
              '<span>Store</span>',
            '</div>',
            '<div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" ',
              'ng-if="vm.canShowButton(vm.item, vm.store, store)" ng-click="MoveToEquip(store, $event)" ',
              'data-type="equip" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})">',
              '<span>Equip</span>',
            '</div>',
          '</div>',
        '</div>'].join('')
    }
  }

  function MovePopupController($scope, dimStoreService) {
    var vm = this;

    vm.stores = dimStoreService.getStores();

    this.canShowButton = function canShowButton(item, sourceStore, targetStore) {
      if (item.notransfer) {
        if ((item.owner === targetSource.id)) {

        }
      }

      return true;
    }
  }

  function Link(scope, element, attrs) {
    scope.MoveToVault = function MoveToVault(store, e) {
      var data = e.srcElement.dataset;
      var item = $window._items[_transfer.dataset.index];

      $window.moveItem(item, data, 1, function() {
        $window.manageItemClick(item, data);
      });
    };

    scope.MoveToGuardian = scope.MoveToEquip = scope.MoveToVault;
  }
})();
