(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimInfuseItem', dimItem);

  dimItem.$inject = ['dimStoreService', 'dimItemService'];

  function dimItem(dimStoreService, dimItemService) {
    return {
      replace: true,
      scope: {
        'item': '=itemData'
      },
      template: [
        '<div title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" class="item">',
        '  <div class="item-elem" ng-class="{ \'complete\': vm.item.complete }">',
        '    <div class="img" dim-bungie-image-fallback="::vm.item.icon"></div>',
        '    <div class="damage-type" ng-if="!vm.item.itemStat && vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '    <div class="item-stat" ng-if="vm.item.primStat.value" ng-class="\'stat-damage-\' + vm.item.dmg">{{ vm.item.primStat.value }}</div>',
        '  </div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: dimItemInfuseCtrl
    };
  }

  dimItemInfuseCtrl.$inject = [];

  function dimItemInfuseCtrl() {
    var vm = this;
    // nothing to do here...only needed for bindToController
  }

})();
