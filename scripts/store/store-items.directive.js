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
          '<div class="items" data-type="item" data-character="{{ vm.store.id }}">',
          '<div class="section weapons">',
            '<div class="title">Weapons</div>',
            '<div class="sub-section sort-primary">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Primary\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-special">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Special\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-heavy">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Heavy\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
          '</div>',
          '<div class="section armor">',
            '<div class="title">Armor</div>',
            '<div class="sub-section sort-helmet">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Helmet\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-gauntlets">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Gauntlets\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-body">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Body\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-leg">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Leg\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-classitem">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'ClassItem\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
          '</div>',
          '<div class="section general">',
            '<div class="title">General</div>',
            '<div class="sub-section sort-armor">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Armor\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-ghost">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Ghost\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-ship">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Ship\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-vehicle">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Vehicle\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-consumable">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Consumable\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-material">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Material\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
            '</div>',
            '<div class="sub-section sort-currency">',
              '<div ng-repeat="(key, item) in vm.store.items | filter:{ type : \'Currency\' } | filter:{ equipped : false }" dim-store-item store-data="vm.store" item-data="item"></div>',
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
