(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItems', StoreItems);

  StoreItems.$inject = ['$document'];

  function StoreItems($document) {
    return {
      bindToController: true,
      controller: StoreItemsCtrl,
      controllerAs: 'vm',
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
        '  <div class="items" data-type="item" data-character="{{ vm.store.id }}">',
        '    <div>',
        '      <div class="title">Weapons</div>',
        '      <div class="item-Weapon sections">',
        '        <div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Weapon\' } | filter:{ equipped : false }"',
        '          class="sort-{{ item.type }}">',
        '          <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <div class="title">Armor</div>',
        '      <div class="item-Armor sections">',
        '        <div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Armor\' } | filter:{ equipped : false }"',
        '          class="sort-{{ item.type }}">',
        '          <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <div class="title">Styling</div>',
        '      <div class="item-Styling sections">',
        '        <div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Styling\' } | filter:{ equipped : false }"',
        '          class="sort-{{ item.type }}">',
        '          <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <div class="title">Miscellaneous</div>',
        '      <div class="item-Miscellaneous sections">',
        '        <div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Miscellaneous\' } | filter:{ equipped : false }"',
        '          class="sort-{{ item.type }}">',
        '          <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <div class="title">Postmaster</div>',
        '      <div class="item-Postmaster sections">',
        '        <div ng-repeat="(key, item) in vm.store.items | filter:{ sort : \'Postmaster\' } | filter:{ equipped : false }"',
        '          class="sort-{{ item.type }}">',
        '          <div dim-store-item store-data="vm.store" item-data="item"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function StoreItemsCtrl($scope) {
      var vm = this;
    }
  }
})();
