(function () {
  'use strict';

  angular.module('dimApp').directive('dimStoreItems', StoreItems);

  function StoreItems($document) {
    return {
      bindToController: true,
      controller: StoreItemsCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
          '<div class="hover"></div>',
          '<div class="items" data-type="item" data-character="{{ vm.store.id }}">',
          '<div>',
            '<div class="title">Weapons</div>',
            '<div class="items-Weapon sections">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Weapon\' } | filter:{ equipped : false } | filter:{ equipment: true }"',
                ' class="sort-{{ item.type.toLowerCase() }}">',
                  '<div dim-store-item store-data="vm.store" item-data="item"></div>',
              '</div>',
            '</div>',
          '</div>',
          '<div>',
            '<div class="title">Armor</div>',
            '<div class="item-Armor sections">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Armor\' } | filter:{ equipped : false } | filter:{ equipment: true }"',
                ' class="sort-{{ item.type.toLowerCase() }}">',
                '<div dim-store-item store-data="vm.store" item-data="item"></div>',
              '</div>',
            '</div>',
          '</div>',
          '<div>',
            '<div class="title">Styling</div>',
            '<div class="item-Styling sections">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Styling\' } | filter:{ equipped : false } | filter:{ equipment: true }"',
                ' class="sort-{{ item.type.toLowerCase() }}">',
                '<div dim-store-item store-data="vm.store" item-data="item"></div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>'].join('')
    };

    function StoreItemsCtrl($scope) {
      var vm = this;
    }

    function Link(scope, element) {
      var vm = scope.vm;
    }
  }
})();
