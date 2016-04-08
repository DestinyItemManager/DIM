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
        compareItem: '=dimCompareItem',
        infuse: '=dimInfuse'
      },
      restrict: 'A',
      replace: true,
      template: [
        '<div>',
        '<div ng-class="vm.classes">',
        '  <span ng-if="vm.item.lockable" class="fa-stack lock-icon" ng-class="{ locking: vm.locking }" ng-click="vm.setLockState(vm.item);">',
        '    <i class="fa fa-circle fa-stack-2x"></i>',
        '    <i class="fa fa-stack-1x fa-inverse" ng-class="{ \'fa-lock\': vm.item.locked, \'fa-unlock\': !vm.item.locked, locking: vm.locking }"></i>',
        '  </span>',
        '  <span><img class="title-element" ng-if=":: vm.item.dmg && vm.item.dmg !== \'kinetic\'" ng-src="/images/{{::vm.item.dmg}}.png"/>',
        '    <a target="_new" href="http://db.destinytracker.com/inventory/item/{{vm.item.hash}}">{{vm.title}}</a></span>',
        '  <span ng-if="vm.light" ng-bind="vm.light"></span>',
        '  <span ng-if="::vm.item.sort == \'Weapons\' || vm.item.sort ==\'Postmaster\'" ng-bind="::vm.item.typeName"></span>',
        '  <span ng-if="vm.item.type === \'Bounties\' && !vm.item.complete" class="bounty-progress"> | {{vm.item.percentComplete}}%</span>',
        '  <span class="pull-right move-popup-info-detail" ng-click="vm.itemDetails = !vm.itemDetails;" ng-if="!vm.showDetailsByDefault && (vm.showDescription || vm.hasDetails) && !vm.item.classified"><span class="fa fa-info-circle"></span></span>',
        '</div>',
        '<div class="item-xp-bar" ng-if="vm.item.percentComplete != null && !vm.item.complete">',
        '  <div ng-style="{ width: vm.item.percentComplete + \'%\' }"></div>',
        '</div>',
        '<div class="item-description" ng-if="vm.itemDetails && vm.showDescription" ng-bind="::vm.item.description"></div>',
        '<div class="item-description" ng-if="vm.item.kills">{{vm.item.kills}} kills ({{vm.item.precisionKills}} precision) with this character.</div>',
        '<div class="item-details" ng-if="vm.item.classified">Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.</div>',
        '<div class="item-details" ng-if="vm.itemDetails && vm.hasDetails">',
        '  <div ng-if="vm.classType && vm.classType !==\'Unknown\'" class="stat-box-row">',
        '    <span class="stat-box-text" ng-bind="vm.classType"></span>',
        '  </div>',
        '  <div class="item-stats" ng-repeat="stat in vm.item.stats track by $index">',
        '    <div class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer" ng-class="{ \'show-quality\': vm.itemQuality }">',
        '         <span ng-if="stat.bar && stat.value && (stat.value === stat.equippedStatsValue || !stat.comparable)" class="stat-box-inner" style="width: {{ 100 * stat.value / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ 100 * stat.value / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner lower-stats" style="width: {{ 100 * (stat.equippedStatsValue - stat.value) / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ 100 * stat.equippedStatsValue / stat.maximumValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner higher-stats" style="width: {{ 100 * (stat.value - stat.equippedStatsValue) / stat.maximumValue }}%"></span>',

        '         <span ng-if="!stat.bar && (!stat.equippedStatsName || stat.comparable)" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue), \'lower-stats\': (stat.value < stat.equippedStatsValue)}">{{ stat.value }}</span>',
        '       </span>',
        '       <span class="stat-box-val" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue && stat.comparable), \'lower-stats\': (stat.value < stat.equippedStatsValue && stat.comparable)}" ng-show="{{ stat.bar }}" class="lower-stats stat-box-val">{{ stat.value }}</span>',
        '       <span ng-show="vm.itemQuality && stat.scaled > 0" class="stat-box-val" ng-class="{ \'show-quality\': vm.itemQuality && stat.scaled > 0  }" ng-show="{{ stat.bar }}" style="color: {{ vm.getColor(vm.getPercent(stat.scaled,stat.split)) }}">({{ vm.getPercent(stat.scaled,stat.split) }}%)</span>',
        '    </div>',
        '  </div>',
        '  <div ng-if="vm.item.quality !== null && vm.item.quality >= 0" class="stat-box-row">',
        '    <span class="stat-box-text">Stats quality</span>',
        '    <span class="stat-box-val" style="width:50%;color:{{ vm.getColor(vm.item.quality) }}">{{ vm.item.quality }}% of max possible roll</span>',
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

  MoveItemPropertiesCtrl.$inject = ['$sce', '$q', 'dimStoreService', 'dimItemService', 'dimSettingsService', 'ngDialog', '$scope', '$rootScope', 'dimBungieService', 'dimPlatformService'];

  function MoveItemPropertiesCtrl($sce, $q, storeService, itemService, settings, ngDialog, $scope, $rootScope, dimBungieService, dimPlatformService) {
    var vm = this;

    vm.hasDetails = (vm.item.stats && vm.item.stats.length) ||
      vm.item.talentGrid ||
      vm.item.objectives;
    vm.showDescription = true;// || (vm.item.description.length &&
                              //    (!vm.item.equipment || (vm.item.objectives && vm.item.objectives.length)));
    vm.locking = false;

    $scope.$on('dim-toggle-item-details', function() {
      vm.itemDetails = !vm.itemDetails;
    });

    vm.getPercent = function(top, bottom) {
      return Math.round(top/bottom*100);
    };

    vm.getColor = function(value) {
        var color = 0;
        if(value <= 85) {
          color = 0;
        } else if(value <= 90) {
          color = 20;
        } else if(value <= 95) {
          color = 60;
        } else if(value <= 99) {
          color = 120;
        } else if(value === 100) {
          color = 190;
        } else {
          return 'white';
        }
        return 'hsl(' + color + ',85%,60%)';
//      value = value - 75 < 0 ? 0 : value - 75;
//      return 'hsl(' + (value/30*120).toString(10) + ',55%,50%)';
    };

    vm.setLockState = function setLockState(item) {
      if (vm.locking) {
        return;
      }

      var store;
      if (item.owner === 'vault') {
        store = storeService.getStores()[0];
      } else {
        store = storeService.getStore(item.owner);
      }

      vm.locking = true;

      itemService.setLockState(item, store, !item.locked)
        .then(function(lockState) {
          item.locked = lockState;
          $rootScope.$broadcast('dim-filter-invalidate');
        })
        .finally(function() {
          vm.locking = false;
        });
    };

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
    vm.itemQuality = false;
    settings.getSetting('itemQuality')
      .then(function(show) {
        vm.itemQuality = vm.itemQuality || show;
      });

    dimBungieService.getWeaponHistory(dimPlatformService.getActive(), vm.item.owner).then(function (history) {
      var weaponHistory = history[vm.item.hash];
      if (weaponHistory) {
        vm.item.kills = weaponHistory.uniqueWeaponKills.basic.value;
        vm.item.precisionKills = weaponHistory.uniqueWeaponPrecisionKills.basic.value;
      }
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

    function compareItems(item) {
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
    }

    /*
     * Get the item stats and its stat name
     * of the equipped item for comparison
     */
    if (vm.item.equipment) {
      if (vm.compareItem) {
        $scope.$watch('vm.compareItem', compareItems);
      } else {
        $scope.$watch('$parent.$parent.vm.store.items', function(items) {
          var item = _.find(items, function(item) {
            return item.equipped && item.type === vm.item.type;
          });
          compareItems(item);
        });
      }
    }
  }
})();
