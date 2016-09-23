(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties);

  function MoveItemProperties() {
    return {
      bindToController: true,
      controller: MoveItemPropertiesCtrl,
      controllerAs: 'vm',
      scope: {
        item: '=dimMoveItemProperties',
        compareItem: '=dimCompareItem',
        infuse: '=dimInfuse',
        changeDetails: '&'
      },
      restrict: 'A',
      replace: true,
      template: [
        '<div>',
        '  <div class="item-header" ng-class="vm.classes">',
        '    <div>',
        '      <span ng-if="vm.item.trackable || vm.item.lockable || vm.item.dmg" class="icon">',
        '        <a ng-if="vm.item.lockable" href ng-click="vm.setItemState(vm.item, \'lock\')" title="{{!vm.item.locked ? \'Lock\':\'Unlock\'}} {{::vm.item.typeName}}">',
        '          <i class="lock fa" ng-class="{\'fa-lock\': vm.item.locked, \'fa-unlock-alt\': !vm.item.locked, \'is-locking\': vm.locking }"></i>',
        '        </a>',
        '        <a ng-if="vm.item.trackable" href ng-click="vm.setItemState(vm.item, \'track\')" title="{{!vm.item.tracked ? \'Track\':\'Untrack\'}} {{::vm.item.typeName}}">',
        '          <i class="lock fa" ng-class="{\'fa-star\': vm.item.tracked, \'fa-star-o\': !vm.item.tracked, \'is-locking\': vm.locking }"></i>',
        '        </a>',
        '      </span>',
        '      <a target="_blank" rel="noopener noreferrer" href="http://db.destinytracker.com/inventory/item/{{ vm.item.hash }}#{{ vm.item.talentGrid.dtrPerks }}" class="item-title">',
        '        {{vm.title}}',
        '      </a>',
        '    </div>',
        '    <div>',
        '      <span ng-if="vm.item.trackable || vm.item.lockable || vm.item.dmg" class="icon">',
        '        <img ng-if="vm.item.dmg && vm.item.dmg !== \'kinetic\'" class="element" ng-src="/images/{{ ::vm.item.dmg }}.png"/>',
        '      </span>',
        '      {{ vm.light }} {{ vm.classType }} {{ vm.item.typeName }}',
        '      <span ng-if="vm.item.objectives">({{ vm.item.percentComplete | percent }} Complete)</span>',
        '      <a ng-if="!vm.showDetailsByDefault && (vm.showDescription || vm.hasDetails) && !vm.item.classified;" href ng-click="vm.changeDetails(); vm.itemDetails = !vm.itemDetails">',
        '        <i class="info fa" ng-class="{ \'fa-chevron-circle-up\': vm.itemDetails, \'fa-chevron-circle-down\': !vm.itemDetails }">',
        '        </i>',
        '      </a>',
        '    <dim-item-tag ng-if="vm.item.lockable && vm.featureFlags.tagsEnabled" item="vm.item"></dim-item-tag>',
        '    </div>',
        '  </div>',
        '  <div class="item-xp-bar" ng-if="vm.item.percentComplete != null && !vm.item.complete">',
        '    <div dim-percent-width="vm.item.percentComplete"></div>',
        '  </div>',
        '  <form ng-if="vm.item.lockable && vm.featureFlags.tagsEnabled" name="notes"><textarea name="data" placeholder="{{ \'notes_placeholder\' | translate }}" class="item-notes" ng-maxlength="120" ng-model="vm.item.dimInfo.notes" ng-model-options="{ debounce: 250 }" ng-change="vm.updateNote()"></textarea></form>',
        '  <span class="item-notes-error" ng-show="notes.data.$error.maxlength">Error! Max 120 characters for notes.</span>',
        '  <div class="item-description" ng-if="vm.itemDetails && vm.showDescription" ng-bind="::vm.item.description"></div>',
        '  <div class="item-details" ng-if="vm.item.classified">Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.</div>',
        '  <div class="stats" ng-if="vm.itemDetails && vm.hasDetails">',
        '    <div class="stat-box-row" ng-repeat="stat in vm.item.stats track by $index">',
        '      <span class="stat-box-text stat-box-cell"> {{ stat.name }} </span>',
        '      <span class="stat-box-outer">',
        '        <span ng-if="stat.bar && stat.value && (stat.value === stat.equippedStatsValue || !stat.comparable)" class="stat-box-inner" dim-percent-width="stat.value / stat.maximumValue"></span>',
        '        <span ng-if="stat.bar && stat.value && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner" dim-percent-width="stat.value / stat.maximumValue"></span>',
        '        <span ng-if="stat.bar && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner lower-stats" dim-percent-width="(stat.equippedStatsValue - stat.value) / stat.maximumValue"></span>',
        '        <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner" dim-percent-width="stat.equippedStatsValue / stat.maximumValue"></span>',
        '        <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner higher-stats" dim-percent-width="(stat.value - stat.equippedStatsValue) / stat.maximumValue"></span>',
        '        <span ng-if="!stat.bar && (!stat.equippedStatsName || stat.comparable)" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue), \'lower-stats\': (stat.value < stat.equippedStatsValue)}">{{ stat.value }}</span>',
        '      </span>',
        '      <span class="stat-box-val stat-box-cell" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue && stat.comparable), \'lower-stats\': (stat.value < stat.equippedStatsValue && stat.comparable)}" ng-show="{{ stat.bar }}">{{ stat.value }}',
        '        <span ng-if="stat.bar && vm.featureFlags.qualityEnabled && vm.settings.itemQuality && stat.qualityPercentage.min" ng-style="stat.qualityPercentage.min | qualityColor:\'color\'">({{ stat.qualityPercentage.range }})</span>',
        '      </span>',
        '    </div>',
        '    <div class="stat-box-row" ng-if="vm.featureFlags.qualityEnabled && vm.item.quality && vm.item.quality.min">',
        '      <span class="stat-box-text stat-box-cell">Stats quality</span>',
        '      <span class="stat-box-cell" ng-style="vm.item.quality.min | qualityColor:\'color\'">{{ vm.item.quality.range }} of max roll</span>',
        '    </div>',
        '  </div>',
        '  <div class="item-details item-perks" ng-if="vm.item.talentGrid && vm.itemDetails">',
        '    <dim-talent-grid dim-talent-grid="vm.item.talentGrid" dim-infuse="vm.infuse(vm.item, $event)"/>',
        '  </div>',
        '  <div class="item-details item-objectives" ng-if="vm.item.objectives.length && vm.itemDetails">',
        '    <div class="objective-row" ng-repeat="objective in vm.item.objectives track by $index" ng-class="{\'objective-complete\': objective.complete, \'objective-boolean\': objective.boolean }">',
        '      <div class="objective-checkbox"><div></div></div>',
        '      <div class="objective-progress">',
        '        <div class="objective-progress-bar" dim-percent-width="objective.progress / objective.completionValue"></div>',
        '        <div class="objective-description" title="{{ objective.description }}">{{ objective.displayName || (objective.complete ? \'Complete\' : \'Incomplete\') }}</div>',
        '        <div class="objective-text">{{ objective.progress }} / {{ objective.completionValue }}</div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', '$q', 'dimStoreService', 'dimItemService', 'dimSettingsService', 'ngDialog', '$scope', '$rootScope', 'dimFeatureFlags'];

  function MoveItemPropertiesCtrl($sce, $q, storeService, itemService, settings, ngDialog, $scope, $rootScope, dimFeatureFlags) {
    var vm = this;

    vm.featureFlags = dimFeatureFlags;

    vm.hasDetails = (vm.item.stats && vm.item.stats.length) ||
      vm.item.talentGrid ||
      vm.item.objectives;
    vm.showDescription = true;// || (vm.item.description.length &&
    //    (!vm.item.equipment || (vm.item.objectives && vm.item.objectives.length)));
    vm.locking = false;

    // The 'i' keyboard shortcut toggles full details
    $scope.$on('dim-toggle-item-details', function() {
      vm.itemDetails = !vm.itemDetails;
      vm.changeDetails();
    });

    vm.updateNote = function() {
      if (angular.isDefined(vm.item.dimInfo.notes)) {
        vm.item.dimInfo.save();
      }
    };

    vm.setItemState = function setItemState(item, type) {
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

      var state = false;
      if (type === 'lock') {
        state = !item.locked;
      } else if (type === 'track') {
        state = !item.tracked;
      }

      itemService.setItemState(item, store, state, type)
        .then(function(lockState) {
          if (type === 'lock') {
            item.locked = lockState;
          } else if (type === 'track') {
            item.tracked = lockState;
          }
          $rootScope.$broadcast('dim-filter-invalidate');
        })
        .finally(function() {
          vm.locking = false;
        });
    };

    vm.classes = {
      'is-arc': false,
      'is-solar': false,
      'is-void': false
    };

    vm.title = $sce.trustAsHtml(vm.item.name);
    vm.light = '';
    vm.classType = '';
    vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
    vm.itemDetails = vm.showDetailsByDefault;
    vm.settings = settings;
    $scope.$watch('vm.settings.itemDetails', function(show) {
      vm.itemDetails = vm.itemDetails || show;
    });

    if (vm.item.primStat) {
      vm.light = vm.item.primStat.value.toString();
      vm.light += ' ' + vm.item.primStat.stat.statName;
      if (vm.item.dmg) {
        vm.classes['is-' + vm.item.dmg] = true;
      }
      if (vm.item.classTypeName !== 'unknown' &&
          // These already include the class name
          vm.item.type !== 'ClassItem' &&
          vm.item.type !== 'Artifact') {
        vm.classType = vm.item.classTypeName[0].toUpperCase() + vm.item.classTypeName.slice(1);
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
