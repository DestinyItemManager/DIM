(function() {
  'use strict';

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = ['$rootScope'];

  function infuseService($rootScope) {

    var data = {
      source: 0,
      infused: 0
    };

    return {
      setSource: function(source) {
        data.source = source;
      },
      setTarget: function(target) {
        data.infused = Math.round((target - data.source) * 0.8 + data.source);
        $rootScope.$emit('infuse', data.infused);
      },
      light: data
    }

  }

  angular.module('dimApp')
    .directive('dimInfuseItem', dimItem);

  dimItem.$inject = ['$rootScope', 'dimStoreService', 'dimItemService'];

  function dimItem($rootScope, dimStoreService, dimItemService) {
    return {
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" class="item" ng-class="{ \'search-hidden\': !vm.item.visible, \'search-item-hidden\': vm.item.visible === false && vm.hideFilteredItems === true, \'complete\': vm.item.complete }">',
        '  <div class="img" ng-class="{ \'how\': vm.item.inHoW }" ng-click="vm.calculate(vm.item.primStat.value)" style="background-size: 44px 44px;"></div>',
        '  <div class="counter" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '  <div class="damage-type" ng-if="!vm.itemStat && vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '  <div class="item-stat" ng-if="vm.itemStat && vm.item.primStat.value" ng-class="\'stat-damage-\' + vm.item.dmg">{{ vm.item.primStat.value }}</div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: ['$rootScope', 'infuseService', function($rootScope, infuseService) {
        var vm = this;
        vm.calculate = function(value) {
          infuseService.setTarget(value);
        }
      }],
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
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$scope', '$rootScope', 'dimStoreService', 'dimItemService', 'infuseService'];

  function dimInfuseCtrl($scope, $rootScope, dimStoreService, dimItemService, infuseService) {
    var vm = this;

    // vm.store = $scope.store;
    vm.item = $scope.item;
    vm.infuseService = infuseService;
    vm.infusable = [];

    infuseService.setSource(vm.item.primStat.value);

    dimStoreService.getStore(vm.item.owner).then(function(store) {
      _.each(store.items, function(item) {
        // The item is the same type and with more light
        if (item.primStat && (item.type == vm.item.type && item.primStat.value > vm.item.primStat.value)) {
          vm.infusable.push(item);
        }
      });
    });

    $rootScope.$on('infuse', function(event, data) {
      vm.infused = data;
      console.log(data);
    });

  }

})();
