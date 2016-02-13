(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties)
    .filter('talentGridNodes', function() {
      return function(nodes) {
        var result = [];
        (nodes || []).forEach(function(node) {
          if (node.hidden || ['Infuse', 'Upgrade Damage', 'Upgrade Defense', 'Arc Damage', 'Solar Damage', 'Void Damage'].indexOf(node.name) >= 0) {
            return;
          }

          var column = result[node.column] = result[node.column] || [];

          if (node.exclusiveInColumn) {
            if (column.length === 0) {
              column.push(node);
            } else if (!column[0].activated && node.activated) {
              result[node.column] = [node];
            }
          } else {
            column.push(node);
          }
        });
        return _.compact(_.flatten(result));
      };
    });



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
        '  <span ng-if="vm.item.locked" class="locked"></span>',
        '  <span><a target="_new" href="http://db.destinytracker.com/inventory/item/{{vm.item.hash}}">{{vm.title}}</a></span>',
        '  <span ng-if="vm.light" ng-bind="vm.light"></span>',
        '  <span ng-if="vm.item.type === \'Bounties\' && !vm.item.complete" class="bounty-progress"> | {{vm.item.xpComplete}}%</span>',
        '  <span class="pull-right move-popup-info-detail" ng-mouseover="vm.itemDetails = true;" ng-if="vm.item.stats.length && !vm.item.classified"><span class="fa fa-info-circle"></span></span>',
        '</div>',
        '<div class="item-details" ng-show="vm.item.classified">Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.</div>',
        '<div class="item-details" ng-show="vm.itemDetails && vm.item.stats.length && vm.item.type != \'Bounties\'">',
        '  <div ng-if="vm.classType && vm.classType !==\'Unknown\'" class="stat-box-row">',
        '    <span class="stat-box-text" ng-bind="vm.classType"></span>',
        '  </div>',
        '  <div class="item-stats" ng-repeat="stat in vm.item.stats track by $index">',
        '    <div class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer">',
        '         <span ng-if="stat.bar && stat.value && (stat.value === stat.equippedStatsValue || !stat.comparable)" class="stat-box-inner" style="width: {{ stat.value }}%"></span>',
        '         <span ng-if="stat.bar && stat.value && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ stat.value }}%"></span>',
        '         <span ng-if="stat.bar && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner lower-stats" style="width: {{ stat.equippedStatsValue - stat.value }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner" style="width: {{ stat.equippedStatsValue }}%"></span>',
        '         <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner higher-stats" style="width: {{ stat.value - stat.equippedStatsValue }}%"></span>',

        '         <span ng-if="!stat.bar && stat.comparable" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue), \'lower-stats\': (stat.value < stat.equippedStatsValue)}">{{ stat.value }}</span>',
        '       </span>',
        '         <span class="stat-box-val" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue && stat.comparable), \'lower-stats\': (stat.value < stat.equippedStatsValue && stat.comparable)}" ng-show="{{ stat.bar }}" class="lower-stats stat-box-val">{{ stat.value }}</span>',
        '    </div>',
        '  </div>',
        '  <div class="item-perks">',
        '    <div class="talent-node talent-node-active" ng-if="vm.item.talentGrid.infusable" ng-click="vm.infuse(vm.item, $event)" title="Infusion calculator" alt="Infusion calculator">',
        '      <div class="talent-node-icon" style="background-image: url(\'/images/{{vm.item.sort}}.png\');cursor:pointer;"></div>',
        '  </div>',
        // TODO: rebuild the full talent grid!
        '    <div class="talent-node" ng-repeat="node in vm.item.talentGrid.nodes | talentGridNodes track by $index" ng-class="{ \'talent-node-active\': node.activated }" title="{{node.name}}\n{{node.description}}">',
        '    <div class="talent-node-icon" style="background-image: url(http://bungie.net{{ node.icon }})"></div>',
        '    <svg ng-if="!node.activated && node.xpRequired" viewBox="-1 -1 34 34" height="44" width="44"><circle ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" fill="none" stroke="#5EA16A" stroke-width="2" r="16" cx="16" cy="16" /></svg>',
        '    </div>',
        '</div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', 'dimSettingsService', 'ngDialog', '$scope'];

  function MoveItemPropertiesCtrl($sce, settings, ngDialog, $scope) {
    var vm = this;

    vm.classes = {
      'item-name': true,
      'is-arc': false,
      'is-solar': false,
      'is-void': false
    };

    vm.title = $sce.trustAsHtml(vm.item.name);
    vm.light = '';
    vm.classType = '';
    vm.itemDetails = false;
    settings.getSetting('itemDetails')
      .then(function(show) {
        vm.itemDetails = show;
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
        if (item) {
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
