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
        '<div title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" class="item" ng-class="{ \'search-hidden\': !vm.item.visible, \'search-item-hidden\': vm.item.visible === false && vm.hideFilteredItems === true, \'complete\': vm.item.complete }">',
        '  <div class="img" style="background-size: 44px 44px;"></div>',
        '  <div class="damage-type" ng-if="!vm.item.itemStat && vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '  <div class="item-stat" ng-if="vm.item.primStat.value" ng-class="\'stat-damage-\' + vm.item.dmg">{{ vm.item.primStat.value }}</div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: dimItemInfuseCtrl,
      link: function (scope, element, attrs) {
        var vm = scope.vm;
        $('<img/>').attr('src', 'http://www.bungie.net' + vm.item.icon).load(function() {
           $(this).remove();
          element[0].querySelector('.img')
            .style.backgroundImage = 'url(' + 'http://www.bungie.net' + vm.item.icon + ')';
        }).error(function() {
           $(this).remove();
          element[0].querySelector('.img')
            .style.backgroundImage = 'url(' + chrome.extension.getURL(vm.item.icon) + ')';
        });
      }
    };
  }

  angular.module('dimApp')
    .controller('dimItemInfuseCtrl', dimItemInfuseCtrl);

  dimItemInfuseCtrl.$inject = [];

  function dimItemInfuseCtrl() {
    var vm = this;
    // nothing to do here...only needed for bindToController
  }

})();
