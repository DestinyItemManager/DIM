(function () {
  'use strict';

  angular.module('dimApp').directive('dimStoreItem', StoreItem);

  function StoreItem(ngDialog) {
    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div class="item{{ vm.item.complete ? \' complete\' : \'\' }}" data-index="{{ vm.item.index }}" data-name="{{ vm.item.name }}" data-instance-id="{{ vm.item.id }}">',
          '<img draggable="true" ng-src="http://bungie.net/{{ vm.item.icon }}" ng-click="vm.openLoadout(vm.item, $event)">',
          '<div class="stack" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '</div>'].join('')
    };

    function StoreItemCtrl($scope) {
      var vm = this;
      var dialogResult = null;

      vm.openLoadout = function openLoadout(item, e) {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          dialogResult = ngDialog.open({
            template: [
                '<div dim-move-item-properties="vm.item"></div>',
                '<div class="locations" ng-repeat="(name, store) in vm.stores">',
                  '<div class="move-button move-vault" data-type="item" data-character="{{ store.id }}" ng-if="name !== \'vault\'" ng-click="MoveToVault(store, $event)">',
                    '<span>Vault</span>',
                  '</div>',
                  '<div class="move-button move-store" data-type="item" data-character="{{ store.id }}" ng-if="name !== \'vault\'" style="background-image: url(http://bungie.net{{ store.icon }})" ng-click="MoveToGuardian(store, $event)">',
                    '<span>Store</span>',
                  '</div>',
                  '<div class="move-button move-equip" data-type="equip" data-character="{{ store.id }}" ng-if="name !== \'vault\'" style="background-image: url(http://bungie.net{{ store.icon }})" ng-click="MoveToEquip(store, $event)">',
                    '<span>Equip</span>',
                  '</div>',
                '</div>'].join(''),
            plain: true,
            controller: function($scope, dimStoreService) {
              var vm = $scope.vm = {};
              var parent = $scope.$parent;

              vm.stores = dimStoreService.getStores();
              vm.currentStore = parent.vm.store;
              vm.item = parent.vm.item;
              vm.isGuardian = vm.currentStore.name !== 'vault';
            },
            appendTo: 'div[data-instance-id="' + item.id + '"]',
            overlay: false,
            scope: $scope
          });

          dialogResult.closePromise.then(function(data) {
            dialogResult = null;
          });
        }
      };
    }

    function Link(scope, element) {
      var vm = scope.vm;

      //element.parent().attr('data-item-id', vm.item.id);
    }
  }
})();
