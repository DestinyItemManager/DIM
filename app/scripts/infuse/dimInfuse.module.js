(function() {
  'use strict';

  angular.module('dimApp')
    .factory('shareDataService', shareDataService);

  shareDataService.$inject = []

  function shareDataService() {

    var shareDataService = this;
    var item = null;

    return {
      getItem: function() {
        return shareDataService.item;
      },
      setItem: function(item) {
        shareDataService.item = item;
      }
    }

  }

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = [];

  function infuseService() {

    var _data = {
      source: 0,
      targets: [],
      infused: 0,
      view: [],
      infusable: [],
      calculate: function() {
        var result = 0;
        for(var i=0;i<_data.targets.length;i++) {
          var target = _data.targets[i].primStat.value;
          if (result > 0) { var source = result; }
          else { var source = _data.source; }
          result = Math.round((target - source) * 0.8 + source);
        }
        return result;
      }
    };

    return {
      setSource: function(source) {
        // Set the source and reset the targets
        _data.source = source;
        _data.infused = 0;
        _data.targets = [];
      },
      setInfusable: function(items) {
        _data.infusable = items;
        _data.view = items;
      },
      toggleItem: function(item) {

        // Add or remove the item from the infusion chain
        var index = _.indexOf(_data.targets, item);
        if (index > -1) {
          _data.targets.splice(index, 1);
        }
        else {
          _data.targets.push(item);
        }

        // Value of infused result
        _data.infused = _data.calculate();
        // The difference from start to finish
        _data.difference = _data.infused - _data.source;

        // let's remove the used gear and the one that are lower than the infused result
        _data.view = _.chain(_data.infusable)
          .difference(_data.targets)
          .filter(function(item) {
            return item.primStat.value > _data.infused;
          })
          .value();

      },
      data: _data,
    }

  }

  angular.module('dimApp')
    .directive('dimInfuseItem', dimItem);

  dimItem.$inject = ['dimStoreService', 'dimItemService'];

  function dimItem(dimStoreService, dimItemService) {
    return {
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" class="item" ng-class="{ \'search-hidden\': !vm.item.visible, \'search-item-hidden\': vm.item.visible === false && vm.hideFilteredItems === true, \'complete\': vm.item.complete }">',
        '  <div class="img" ng-click="vm.toggleItem(vm.item)" style="background-size: 44px 44px;"></div>',
        '  <div class="damage-type" ng-if="!vm.item.itemStat && vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '  <div class="item-stat" ng-if="vm.item.primStat.value" ng-class="\'stat-damage-\' + vm.item.dmg">{{ vm.item.primStat.value }}</div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: ['infuseService', function(infuseService) {
        var vm = this;
        vm.toggleItem = function(item) {
          infuseService.toggleItem(item);
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

  dimInfuseCtrl.$inject = ['dimStoreService', 'dimItemService', 'infuseService', 'shareDataService'];

  function dimInfuseCtrl(dimStoreService, dimItemService, infuseService, shareDataService) {
    var vm = this;

    // vm.item = $scope.item;
    vm.item = shareDataService.getItem();
    vm.infuseService = infuseService;

    infuseService.setSource(vm.item.primStat.value);

    dimStoreService.getStore(vm.item.owner).then(function(store) {

      var items = _.chain(store.items).filter(function(item) {
          return (item.primStat && (item.type == vm.item.type && item.primStat.value > vm.item.primStat.value))
        })
        .sortBy(function(item) {
          return item.primStat.value;
        })
        .value();

      infuseService.setInfusable(items);

    });

  }

})();
