(function () {
  'use strict';

  angular.module('dimApp').directive('dimStoreEquipped', StoreEquipped);

  function StoreEquipped(ngDialog) {
    return {
      bindToController: true,
      controller: StoreEquippedCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
          '<div class="title">Equipped</div>',
          '<div class="items sections" data-type="equip" data-character="{{ vm.store.id }}" ng-show="vm.isGuardian">',
            '<div ng-repeat="item in vm.store.items | filter:{ equipped : true } | filter:{ equipment : true }" class="sort-{{ item.type.toLowerCase() }}">',
              '<div dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
          '</div>',
        '</div>'].join('')
    };

    function StoreEquippedCtrl() {
      var vm = this;

      vm.isGuardian = (vm.store.id !== 'vault');
    }

    function Link(scope, element) {
      var vm = scope.vm;
    }
  }
})();
