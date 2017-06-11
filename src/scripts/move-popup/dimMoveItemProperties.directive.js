import angular from 'angular';
import _ from 'underscore';
import template from './dimMoveItemProperties.directive.html';

angular.module('dimApp')
  .component('dimObjectives', Objectives())
  .directive('dimMoveItemProperties', MoveItemProperties);

function Objectives() {
  return {
    bindings: {
      objectives: '<'
    },
    template: template
  };
}

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
      '    <div class="item-title-container">',
      '      <div ng-if="vm.item.trackable || vm.item.lockable || vm.item.dmg" class="icon">',
      '        <div ng-if="vm.item.lockable" ng-click="vm.setItemState(vm.item, \'lock\')" translate-values="{itemType: vm.item.typeName, locked: vm.item.locked}" translate-attr="{title: \'MovePopup.LockUnlock\'}">',
      '          <i class="lock fa" ng-class="{\'fa-lock\': vm.item.locked, \'fa-unlock-alt\': !vm.item.locked, \'is-locking\': vm.locking }"></i>',
      '        </div>',
      '        <div ng-if="vm.item.trackable" ng-click="vm.setItemState(vm.item, \'track\')" translate-values="{itemType: vm.item.typeName, tracked: vm.item.tracked}" translate-attr="{title: \'MovePopup.TrackUntrack\'}">',
      '          <i class="lock fa" ng-class="{\'fa-star\': vm.item.tracked, \'fa-star-o\': !vm.item.tracked, \'is-locking\': vm.locking }"></i>',
      '        </div>',
      '      </div>',
      '      <div class="item-title-link">',
      '        <a target="_blank" rel="noopener noreferrer" href="http://db.destinytracker.com/inventory/item/{{ vm.item.hash }}#{{ vm.item.talentGrid.dtrPerks }}" class="item-title">',
      '          {{vm.item.name}}',
      '        </a>',
      '      </div>',
      '      <i translate-attr="{ title: \'DtrReview.DiscussHint\'}" ng-if="vm.item.talentGrid && vm.item.equipment && vm.item.lockable" class="dtr-review-discuss-button fa fa-comment" ng-click="vm.openDiscuss()"></i>',
      '      <i translate-attr="{ title: \'Compare.ButtonHelp\'}" ng-if="vm.featureFlags.compareEnabled && vm.item.talentGrid && vm.item.equipment && vm.item.lockable" class="compare-button fa fa-clone" ng-click="vm.openCompare()"></i>',
      '      <div ng-if="!vm.showDetailsByDefault && (vm.showDescription || vm.hasDetails) && !vm.item.classified;" ng-click="vm.changeDetails(); vm.itemDetails = !vm.itemDetails">',
      '        <i class="info fa" ng-class="{ \'fa-chevron-circle-up\': vm.itemDetails, \'fa-chevron-circle-down\': !vm.itemDetails }">',
      '        </i>',
      '      </div>',
      '    </div>',
      '    <div class="item-subtitle">',
      '      <div ng-if="vm.item.trackable || vm.item.lockable || vm.item.dmg" class="icon">',
      '        <div ng-if="vm.item.dmg && vm.item.dmg !== \'kinetic\'" class="element" ng-class="::vm.item.dmg"></div>',
      '      </div>',
      '      <div class="item-type-info" translate-values="{ light: vm.light, statName: vm.item.primStat.stat.statName, classType: vm.classType, typeName: vm.item.typeName }" translate="MovePopup.Subtitle"></div>',
      '      <div ng-if="vm.item.objectives" translate-values="{ percent: vm.item.percentComplete }" translate="ItemService.PercentComplete"></div>',
      '      <dim-item-tag ng-if="vm.featureFlags.tagsEnabled && vm.item.taggable" item="vm.item"></dim-item-tag>',
      '    </div>',
      '  </div>',
      '  <div class="item-xp-bar" ng-if="vm.item.percentComplete != null && !vm.item.complete" dim-percent-width="vm.item.percentComplete"></div>',
      '  <form ng-if="vm.featureFlags.tagsEnabled && vm.item.taggable" name="notes"><textarea name="data" translate-attr="{ placeholder: \'Notes.Help\' }" class="item-notes" ng-maxlength="120" ng-model="vm.item.dimInfo.notes" ng-model-options="{ debounce: 250 }" ng-change="vm.updateNote()"></textarea></form>',
      '  <span class="item-notes-error" ng-show="notes.data.$error.maxlength" translate="Notes.Error"></span>',
      '  <form ng-if="vm.item.lockable" name="dtrReview" ng-submit="vm.submitReview()"><div class="item-review-container"><select class="item-dtr-review-input" ng-model="vm.item.userRating" ng-options="item for item in vm.dtrRatingOptions" ng-blur="vm.reviewBlur()"></select><textarea translate-attr="{ placeholder: \'DtrReview.Help\' }" class="item-dtr-review" ng-maxlength="120" ng-model="vm.item.userReview" ng-model-options="{ debounce: 250 }" ng-blur="vm.reviewBlur()"></textarea><input class="item-dtr-review-submit" type="submit" translate-attr="{ value: \'DtrReview.Submit\' }" ng-disabled="!vm.item.userRating || vm.item.userRating < 1" /></div></form>',
      '  <span class="item-dtr-review-error" ng-show="dtrReview.data.$error.maxlength" translate="DtrReview.Error"></span>',
      '  <div class="item-description" ng-if="vm.itemDetails && vm.showDescription" ng-bind="::vm.item.description"></div>',
      '  <div class="item-details" ng-if="vm.item.classified" translate="ItemService.Classified2"></div>',
      '  <div class="stats" ng-if="vm.itemDetails && vm.hasDetails">',
      '    <div class="stat-box-row" ng-repeat="stat in vm.item.stats track by $index">',
      '      <span class="stat-box-text stat-box-cell"> {{ stat.name }} </span>',
      '      <span class="stat-box-outer"><span class="stat-box-container">',
      '        <span ng-if="stat.bar && stat.value && (stat.value === stat.equippedStatsValue || !stat.comparable)" class="stat-box-inner" dim-percent-width="stat.value / stat.maximumValue"></span>',
      '        <span ng-if="stat.bar && stat.value && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner" dim-percent-width="stat.value / stat.maximumValue"></span>',
      '        <span ng-if="stat.bar && stat.value < stat.equippedStatsValue && stat.comparable" class="stat-box-inner lower-stats" dim-percent-width="(stat.equippedStatsValue - stat.value) / stat.maximumValue"></span>',
      '        <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner" dim-percent-width="stat.equippedStatsValue / stat.maximumValue"></span>',
      '        <span ng-if="stat.bar && stat.value > stat.equippedStatsValue && stat.comparable" class="stat-box-inner higher-stats" dim-percent-width="(stat.value - stat.equippedStatsValue) / stat.maximumValue"></span>',
      '        <span ng-if="!stat.bar && (!stat.equippedStatsName || stat.comparable)" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue), \'lower-stats\': (stat.value < stat.equippedStatsValue)}">{{ stat.value }}</span>',
      '      </span></span>',
      '      <span class="stat-box-val stat-box-cell" ng-class="{ \'higher-stats\': (stat.value > stat.equippedStatsValue && stat.comparable), \'lower-stats\': (stat.value < stat.equippedStatsValue && stat.comparable)}" ng-show="{{ stat.bar }}">{{ stat.value }}',
      '        <span ng-if="stat.bar && vm.featureFlags.qualityEnabled && vm.settings.itemQuality && stat.qualityPercentage.min" ng-style="stat.qualityPercentage.min | qualityColor:\'color\'">({{ stat.qualityPercentage.range }})</span>',
      '      </span>',
      '    </div>',
      '    <div class="stat-box-row" ng-if="vm.featureFlags.qualityEnabled && vm.item.quality && vm.item.quality.min">',
      '      <span class="stat-box-text stat-box-cell stat-box-wrap" translate="Stats.Quality"></span>',
      '      <span class="stat-box-cell stat-box-wrap" ng-style="vm.item.quality.min | qualityColor:\'color\'" translate-values="{ range: vm.item.quality.range }" translate="Stats.OfMaxRoll"></span><span><a href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is" target="_blank"><i class="fa fa-question-circle" translate-attr="{ title: \'Stats.PercentHelp\'}"></i></a></span>',
      '    </div>',
      '  </div>',
      '  <div class="item-details item-perks" ng-if="vm.item.talentGrid && vm.itemDetails">',
      '    <dim-talent-grid talent-grid="vm.item.talentGrid" dim-infuse="vm.infuse(vm.item, $event)"></dim-talent-grid>',
      '  </div>',
      '  <dim-objectives class="item-details" ng-if="vm.itemDetails" objectives="vm.item.objectives"></dim-objectives>',
      '  <div ng-if="vm.featureFlags.debugMode" class="item-details">',
      '    <a ui-sref="debugItem({itemId: vm.item.id})" translate="Debug.View"></a>',
      '    <button ng-click="vm.dumpDebugInfo()" translate="Debug.Dump"></a>',
      '  </div>',
      '</div>'
    ].join('')
  };
}


function MoveItemPropertiesCtrl($sce, $q, dimStoreService, dimItemService, dimSettingsService, ngDialog, dimState, $scope, $rootScope, dimDefinitions, dimDestinyTrackerService) {
  var vm = this;

  vm.dtrRatingOptions = [1, 2, 3, 4, 5];

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    compareEnabled: $featureFlags.compareEnabled,
    tagsEnabled: $featureFlags.tagsEnabled,
    debugMode: dimState.debug
  };

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

  vm.openCompare = function() {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-store-item-compare', {
      item: vm.item,
      dupes: true
    });
  };

  vm.openDiscuss = function() {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-store-item-discuss', {
      item: vm.item
    });
  };

  vm.updateNote = function() {
    if (angular.isDefined(vm.item.dimInfo.notes)) {
      vm.item.dimInfo.save();
    }
  };

  vm.reviewBlur = function() {
    var item = vm.item;
    var userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.toUserReview = function(item) {
    var newRating = item.userRating;
    var review = item.userReview;
    var pros = item.userReviewPros;
    var cons = item.userReviewCons;

    var userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.submitReview = function() {
    var item = vm.item;

    var userReview = vm.toUserReview(item);

    $rootScope.$broadcast('review-submitted', item, userReview);

    return false;
  };

  vm.setItemState = function setItemState(item, type) {
    if (vm.locking) {
      return;
    }

    var store;
    if (item.owner === 'vault') {
      store = dimStoreService.getStores()[0];
    } else {
      store = dimStoreService.getStore(item.owner);
    }

    vm.locking = true;

    var state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    dimItemService.setItemState(item, store, state, type)
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

  vm.light = null;
  vm.classType = '';
  vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
  vm.itemDetails = vm.showDetailsByDefault;
  vm.settings = dimSettingsService;
  $scope.$watch('vm.settings.itemDetails', function(show) {
    vm.itemDetails = vm.itemDetails || show;
  });

  if (vm.item.primStat) {
    vm.light = vm.item.primStat.value.toString();
    if (vm.item.dmg) {
      vm.classes['is-' + vm.item.dmg] = true;
    }
  }

  if (vm.item.classTypeName !== 'unknown' &&
      // These already include the class name
      vm.item.type !== 'ClassItem' &&
      vm.item.type !== 'Artifact' &&
      vm.item.type !== 'Class') {
    vm.classType = vm.item.classTypeNameLocalized[0].toUpperCase() + vm.item.classTypeNameLocalized.slice(1);
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

  vm.dumpDebugInfo = function() {
    console.log("DEBUG INFO for '" + vm.item.name + "'");
    console.log("DIM Item", vm.item);
    console.log("Bungie API Item", vm.item.originalItem || "Enable debug mode (ctrl+alt+shift+d) and refresh items to see this.");
    dimDefinitions.getDefinitions().then((defs) => {
      console.log("Manifest Item Definition", defs.InventoryItem.get(vm.item.hash));
    });
  };
}
