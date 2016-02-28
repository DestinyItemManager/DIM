(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties);

  MoveItemProperties.$inject = ['$sce'];

  function MoveItemProperties($sce) {
    return {
      bindToController: true,
      controller: MoveItemPropertiesCtrl,
      controllerAs: 'vm',
      scope: {
        item: '=dimMoveItemProperties',
        infuse: '=dimInfuse'
      },
      restrict: 'A',
      replace: true,
      template: [
        '<div>',
        '<div ng-class="vm.classes">',
        '  <span ng-if="vm.item.lockable" class="lock-icon" ng-class="{ locked: vm.item.locked }" ng-click="vm.setLockState(vm.item);"></span>',
        '  <span><a target="_new" href="http://db.destinytracker.com/inventory/item/{{vm.item.hash}}">{{vm.title}}</a></span>',
        '  <span ng-if="vm.light" ng-bind="vm.light"></span>',
        '  <span ng-if="::vm.item.weaponClassName" ng-bind="::vm.item.weaponClassName"></span>',
        '  <span ng-if="vm.item.type === \'Bounties\' && !vm.item.complete" class="bounty-progress"> | {{vm.item.xpComplete}}%</span>',
        '  <span class="pull-right move-popup-info-detail" ng-mouseover="vm.itemDetails = true;" ng-if="!vm.showDetailsByDefault && (vm.showDescription || vm.hasDetails) && !vm.item.classified"><span class="fa fa-info-circle"></span></span>',
        '</div>',
        '<div class="item-xp-bar" ng-if="(vm.item.talentGrid || vm.item.xpComplete) && !vm.item.complete && vm.item.objectives.length !== 1">',
        '  <div ng-style="{ width: (vm.item.talentGrid ? (100 * vm.item.talentGrid.totalXP / vm.item.talentGrid.totalXPRequired) : vm.item.xpComplete) + \'%\' }"></div>',
        '</div>',
        '<div class="item-description" ng-if="vm.itemDetails && vm.showDescription" ng-bind="::vm.item.description"></div>',
        '<div class="item-details" ng-if="vm.item.classified">Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.</div>',
        '<div class="item-details" ng-if="vm.itemDetails && vm.hasDetails">',
        '  <div ng-if="vm.classType && vm.classType !==\'Unknown\'" class="stat-box-row">',
        '    <span class="stat-box-text" ng-bind="vm.classType"></span>',
        '  </div>',
        '  <div class="item-stats" ng-repeat="stat in vm.item.stats track by $index">',
        '    <div class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer">',
        '         <span ng-if="stat.bar && stat.value && (stat.value === stat.equippedStatsValue || !stat.comparable)" class="stat-box-inner" style="width: {{ 100 * stat.value / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ 100 * stat.value / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner lower-stats" style="width: {{ 100 * (stat.equippedStatsValue - stat.value) / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ 100 * stat.equippedStatsValue / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner higher-stats" style="width: {{ 100 * (stat.value - stat.equippedStatsValue) / stat.maximumValue }}%"></span>',

        '         <span ng-if="!stat.bar && (!stat.equippedStatsName || stat.comparable)" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue), \'lower-stats\': (stat.value < stat.equippedStatsValue)}">{{ stat.value }}</span>',
        '       </span>',
        '         <span class="stat-box-val" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue && stat.comparable), \'lower-stats\': (stat.value < stat.equippedStatsValue && stat.comparable)}" ng-show="{{ stat.bar }}" class="lower-stats stat-box-val">{{ stat.value }}</span>',
        '    </div>',
        '  </div>',
        '</div>',
        '<div class="item-details item-perks" ng-if="vm.item.talentGrid && vm.itemDetails">',
        '  <dim-talent-grid dim-talent-grid="vm.item.talentGrid" dim-infuse="vm.infuse(vm.item, $event)"/>',
        '</div>',
        '<div class="item-details item-objectives" ng-if="vm.item.objectives.length && vm.itemDetails">',
        '  <div class="objective-row" ng-repeat="objective in vm.item.objectives track by $index" ng-class="{\'objective-complete\': objective.complete, \'objective-boolean\': objective.boolean }">',
        '     <div class="objective-checkbox"><div></div></div>',
        '     <div class="objective-progress">',
        '       <div class="objective-progress-bar" style="width: {{ 100 * objective.progress / objective.completionValue }}%"></div>',
        '       <div class="objective-description">{{ objective.description || (objective.complete ? \'Complete\' : \'Incomplete\') }}</div>',
        '       <div class="objective-text">{{ objective.progress }} / {{ objective.completionValue }}</div>',
        '     </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', '$q', 'dimStoreService', 'dimItemService', 'dimSettingsService', 'ngDialog', '$scope'];

  function MoveItemPropertiesCtrl($sce, $q, storeService, itemService, settings, ngDialog, $scope) {
    var vm = this;

    vm.hasDetails = (vm.item.stats && vm.item.stats.length) ||
      vm.item.talentGrid ||
      vm.item.objectives;
    vm.showDescription = true;// || (vm.item.description.length &&
                              //    (!vm.item.equipment || (vm.item.objectives && vm.item.objectives.length)));

    vm.setLockState = function setLockState(item) {
      var storeId = item.owner;
      var storePromise;

      if (storeId === 'vault') {
        storePromise = $q.when(storeService.getStores())
          .then(function(stores) {
            return stores[0];
          });
      } else {
        storePromise = storeService.getStore(item.owner);
      }

      storePromise
        .then(function(store) {
          return itemService.setLockState(item, store, !item.locked)
            .then(function(lockState) {
              item.locked = lockState;
            });
        })
    }

    vm.classes = {
      'item-name': true,
      'is-arc': false,
      'is-solar': false,
      'is-void': false
    };

    vm.title = $sce.trustAsHtml(vm.item.name);
    vm.light = '';
    vm.classType = '';
    vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
    vm.itemDetails = vm.showDetailsByDefault;
    settings.getSetting('itemDetails')
      .then(function(show) {
        vm.itemDetails = vm.itemDetails || show;
      });

    if (vm.item.primStat) {
      vm.light = vm.item.primStat.value.toString();
      if (vm.item.primStat.statHash === 3897883278) {
        // it's armor.
        vm.light += ' Defense';
        vm.classType = vm.item.classTypeName[0].toUpperCase() + vm.item.classTypeName.slice(1);
      } else if (vm.item.primStat.statHash === 368428387) {
        // it's a weapon.
        vm.light += ' Attack';
        vm.classes['is-' + vm.item.dmg] = true;
      }
    }

    /*
     * Get the item stats and its stat name
     * of the equipped item for comparison
     */
    if (vm.item.equipment) {
      $scope.$watch('$parent.$parent.vm.store.items', function(items) {
        var item = _.find(items, function(item) {
          return item.equipped && item.type === vm.item.type;
        });
        if (item && vm.item.stats) {
          for (var key in Object.getOwnPropertyNames(vm.item.stats)) {
            var itemStats = item.stats && item.stats[key];
            if (itemStats) {
              var vmItemStats = vm.item.stats[key];
              if (vmItemStats) {
                vmItemStats.equippedStatsValue = itemStats.value;
                vmItemStats.equippedStatsName = itemStats.name;
                vmItemStats.comparable = vmItemStats.equippedStatsName === vmItemStats.name ||
                  (vmItemStats.name === 'Magazine' && vmItemStats.equippedStatsName === 'Energy') ||
                  (vmItemStats.name === 'Energy' && vmItemStats.equippedStatsName === 'Magazine');
              }
            }
          }
        }
      });
    }
  }
})();
