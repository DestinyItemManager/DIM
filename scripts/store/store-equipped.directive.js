(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreEquipped', StoreEquipped);

  StoreEquipped.$inject = ['ngDialog'];

  function StoreEquipped(ngDialog) {
    return {
      controller: StoreEquippedCtrl,
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div ui-on-drop="vm.onDrop(\'equipment\', $event)" drag-enter-class="drag-enter" drag-hover-class="drag-hover">',
        '  <div class="title">Equipped</div>',
        '  <div class="items sections" data-type="equip" data-character="{{ vm.store.id }}" ng-show="vm.isGuardian">',
        '    <div ng-repeat="item in vm.store.items | filter:{ equipped : true } | filter:{ equipment : true }" class="sort-{{ item.type.toLowerCase() }}">',
        '      <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function StoreEquippedCtrl() {
      var vm = this;

      vm.isGuardian = (vm.store.id !== 'vault');

      vm.onDrop = function(type, e) {
        alert(type);
      }
    }
  }
})();
