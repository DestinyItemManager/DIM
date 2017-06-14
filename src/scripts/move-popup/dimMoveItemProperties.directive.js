import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .component('dimObjectives', Objectives())
  .directive('dimMoveItemProperties', MoveItemProperties);

function Objectives() {
  return {
    bindings: {
      objectives: '<'
    },
    template: [
      '<div class="item-objectives" ng-if="$ctrl.objectives.length">',
      '  <div class="objective-row" ng-switch="objective.displayStyle" ng-repeat="objective in $ctrl.objectives track by $index" ng-class="{\'objective-complete\': objective.complete, \'objective-boolean\': objective.boolean }">',
      '    <div ng-switch-when="trials">',
      '      <i class="fa fa-circle trials" ng-repeat="i in objective.completionValue | range track by $index" ng-class="{\'incomplete\': $index >= objective.progress, \'wins\': objective.completionValue === 9}"></i>',
      '      <span ng-if="objective.completionValue === 9 && objective.progress > 9"> + {{ objective.progress - 9 }}</span>',
      '    </div>',
      '    <div ng-switch-default class="objective-checkbox"><div></div></div>',
      '    <div ng-switch-default class="objective-progress">',
      '      <div class="objective-progress-bar" dim-percent-width="objective.progress / objective.completionValue"></div>',
      '      <div class="objective-description">{{ objective.displayName }}</div>',
      '      <div class="objective-text">{{ objective.display }}</div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
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
      '      <i translate-attr="{ title: \'Compare.ButtonHelp\'}" ng-if="vm.item.comparable" class="compare-button fa fa-clone" ng-click="vm.openCompare()"></i>',
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
      '      <dim-item-tag ng-if="vm.item.taggable" item="vm.item"></dim-item-tag>',
      '    </div>',
      '    <div ng-show="vm.item.reviewable && vm.item.totalReviews" class="item-review-average">',
      '      <star-rating rating="vm.item.dtrRating" read-only></star-rating>',
      '      <span translate="DtrReview.AverageRating" translate-values="{ itemRating: vm.item.dtrRating, numReviews: vm.item.totalReviews }"></span>',
      '    </div>',
      '  </div>',
      '  <div class="item-xp-bar" ng-if="vm.item.percentComplete != null && !vm.item.complete" dim-percent-width="vm.item.percentComplete"></div>',

      '  <div ng-if="vm.item.reviewable" class="move-popup-tabs">',
      '    <span class="move-popup-tab" ng-class="{selected: vm.tab===\'default\'}" ng-click="vm.tab=\'default\'" translate="MovePopup.OverviewTab"></span>',
      '    <span class="move-popup-tab" ng-class="{selected: vm.tab===\'reviews\'}" ng-click="vm.tab=\'reviews\'" translate="MovePopup.ReviewsTab"></span>',
      '  </div>',
      '  <dim-item-review item="vm.item" ng-if="vm.item.lockable" ng-show="vm.tab === \'reviews\'"></dim-item-review>',
      '  <div ng-show="vm.tab === \'default\'">',
      '    <form ng-if="vm.item.taggable" name="notes"><textarea name="data" translate-attr="{ placeholder: \'Notes.Help\' }" ng-maxlength="120" ng-model="vm.item.dimInfo.notes" ng-model-options="{ debounce: 250 }" ng-change="vm.updateNote()"></textarea></form>',
      '    <span class="textarea-error" ng-show="notes.data.$error.maxlength" translate="Notes.Error"></span>',
      '    <div class="item-description" ng-if="vm.itemDetails && vm.showDescription" ng-bind="::vm.item.description"></div>',
      '    <div class="item-details" ng-if="vm.item.classified" translate="ItemService.Classified2"></div>',
      '    <dim-item-stats item="vm.item" class="stats" ng-if="vm.itemDetails && vm.hasDetails"></dim-item-stats>',
      '    <div class="item-details item-perks" ng-if="vm.item.talentGrid && vm.itemDetails">',
      '      <dim-talent-grid talent-grid="vm.item.talentGrid" dim-infuse="vm.infuse(vm.item, $event)"></dim-talent-grid>',
      '    </div>',

      '    <dim-objectives class="item-details" ng-if="vm.itemDetails" objectives="vm.item.objectives"></dim-objectives>',
      '    <div ng-if="vm.featureFlags.debugMode" class="item-details">',
      '      <a ui-sref="debugItem({itemId: vm.item.id})" translate="Debug.View"></a>',
      '      <button ng-click="vm.dumpDebugInfo()" translate=Debug.Dump></a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };
}


function MoveItemPropertiesCtrl($sce, $q, dimStoreService, dimItemService, dimSettingsService, ngDialog, dimState, $scope, $rootScope, dimDefinitions, dimDestinyTrackerService) {
  var vm = this;

  vm.tab = 'default';

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
