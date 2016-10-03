(function() {
  'use strict';
  angular.module('dimApp')
    .directive('dimLoadoutPopup', LoadoutPopup);

  LoadoutPopup.$inject = [];

  function LoadoutPopup() {
    return {
      controller: LoadoutPopupCtrl,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      scope: {
        store: '=dimLoadoutPopup'
      },
      replace: true,
      template: [
        '<div class="loadout-popup-content">',
        '  <ul class="loadout-list">',
        '    <li class="loadout-set">',
        '      <span ng-click="vm.newLoadout($event)"><i class="fa fa-plus-circle"></i> {{ \'Create Loadout\' | translate }}</span>',
        '      <span ng-click="vm.newLoadoutFromEquipped($event)" translate="loadout_from_equipped"></span>',
        '    </li>',
        '    <li ng-repeat="loadout in vm.loadouts track by loadout.id" class="loadout-set">',
        '      <span title="{{ loadout.name }}" ng-click="vm.applyLoadout(loadout, $event)">{{ loadout.name }}</span>',
        '      <span title="{{ \'Delete Loadout\' | translate }}" ng-click="vm.deleteLoadout(loadout, $event)"><i class="fa fa-trash-o"></i></span>',
        '      <span title="{{ \'Edit Loadout\' | translate }}" ng-click="vm.editLoadout(loadout, $event)"><i class="fa fa-pencil"></i></span>',
        '    </li>',
        '    <li class="loadout-set" ng-if="vm.search.query">',
        '      <span ng-click="vm.searchLoadout($event)"><i class="fa fa-search"></i> {{ \'apply_search_loadout\' | translate:{ query: vm.search.query } }}</span>',
        '    </li>',
        '    <li class="loadout-set" ng-if="!vm.store.isVault">',
        '      <span ng-click="vm.maxLightLoadout($event)"><i class="fa fa-star"></i> {{ \'Maximize Light\' | translate }}</span>',
        '    </li>',
        '    <li class="loadout-set" ng-if="!vm.store.isVault">',
        '      <span ng-click="vm.itemLevelingLoadout($event)"><i class="fa fa-level-up"></i> {{ \'Item Leveling\' | translate }}</span>',
        '    </li>',
        '    <li class="loadout-set">',
        '      <span ng-click="vm.gatherEngramsLoadout($event, { exotics: true  } )"><img class="fa" src="/images/engram.svg" height="12" width="12"/> {{ \'Gather Engrams\' | translate }}</span>',
        '      <span ng-click="vm.gatherEngramsLoadout($event, { exotics: false })"><i class="fa fa-ban"></i> {{ \'gather_engrams_except_exotics\' | translate }}</span>',
        '    </li>',
        '    <li class="loadout-set" ng-if="!vm.store.isVault">',
        '      <span ng-click="vm.startFarmingEngrams($event)"><img class="fa" src="/images/engram.svg" height="12" width="12"/> {{ \'farming_mode\' | translate }}</span>',
        '    </li>',
        '    <li class="loadout-set" ng-if="vm.previousLoadout">',
        '      <span title="{{ vm.previousLoadout.name }}" ng-click="vm.applyLoadout(vm.previousLoadout, $event, true)"><i class="fa fa-undo"></i> {{vm.previousLoadout.name}}</span>',
        '      <span ng-click="vm.applyLoadout(vm.previousLoadout, $event)">{{\'restore_all_items\' | translate }}</span>',
        '    </li>',
        '  </ul>',
        '</div>'
      ].join('')
    };
  }

  LoadoutPopupCtrl.$inject = ['$rootScope', 'ngDialog', 'dimLoadoutService', 'dimItemService', 'toaster', 'dimEngramFarmingService', '$window', 'dimSearchService', 'dimPlatformService'];

  function LoadoutPopupCtrl($rootScope, ngDialog, dimLoadoutService, dimItemService, toaster, dimEngramFarmingService, $window, dimSearchService, dimPlatformService) {
    var vm = this;
    vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);

    vm.classTypeId = {
      warlock: 0,
      titan: 1,
      hunter: 2
    }[vm.store.class];
    if (vm.classTypeId === undefined) {
      vm.classTypeId = -1;
    }

    vm.search = dimSearchService;

    function initLoadouts() {
      dimLoadoutService.getLoadouts()
        .then(function(loadouts) {
          var platform = dimPlatformService.getActive();

          vm.loadouts = _.sortBy(loadouts, 'name') || [];

          vm.loadouts = _.chain(vm.loadouts)
            .filter((item) => _.isUndefined(item.platform) || item.platform === platform.label)
            .filter(function(item) {
              return vm.classTypeId === -1 || ((item.classType === -1) || (item.classType === vm.classTypeId));
            })
            .value();
        });
    }
    $rootScope.$on('dim-save-loadout', initLoadouts);
    $rootScope.$on('dim-delete-loadout', initLoadouts);
    initLoadouts();

    vm.newLoadout = function newLoadout() {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-create-new-loadout', { });
    };

    vm.newLoadoutFromEquipped = function newLoadout($event) {
      ngDialog.closeAll();

      var loadout = filterLoadoutToEquipped(vm.store.loadoutFromCurrentlyEquipped(""));
      // We don't want to prepopulate the loadout with a bunch of cosmetic junk
      // like emblems and ships and horns.
      loadout.items = _.pick(loadout.items,
                             'class',
                             'primary',
                             'special',
                             'heavy',
                             'helmet',
                             'gauntlets',
                             'chest',
                             'leg',
                             'classitem',
                             'artifact',
                             'ghost');
      loadout.classType = vm.classTypeId;
      vm.editLoadout(loadout, $event);
    };

    vm.deleteLoadout = function deleteLoadout(loadout) {
      if ($window.confirm("Are you sure you want to delete '" + loadout.name + "'?")) {
        dimLoadoutService.deleteLoadout(loadout);
      }
    };

    vm.editLoadout = function editLoadout(loadout) {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-edit-loadout', {
        loadout: loadout
      });
    };

    function filterLoadoutToEquipped(loadout) {
      var filteredLoadout = angular.copy(loadout);
      filteredLoadout.items = _.mapObject(filteredLoadout.items, function(items) {
        return _.select(items, 'equipped');
      });
      return filteredLoadout;
    }

    vm.applyLoadout = function applyLoadout(loadout, $event, filterToEquipped) {
      ngDialog.closeAll();
      dimEngramFarmingService.stop();

      if (filterToEquipped) {
        loadout = filterLoadoutToEquipped(loadout);
      }

      dimLoadoutService.applyLoadout(vm.store, loadout, true).then(() => {
        vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);
      });
    };

    // A dynamic loadout set up to level weapons and armor
    vm.itemLevelingLoadout = function itemLevelingLoadout($event) {
      var applicableItems = _.select(dimItemService.getItems(), function(i) {
        return i.canBeEquippedBy(vm.store) &&
          i.talentGrid &&
          !i.talentGrid.xpComplete && // Still need XP
          i.hash !== 2168530918; // Husk of the pit has a weirdo one-off xp mechanic
      });

      var bestItemFn = function(item) {
        var value = 0;

        if (item.owner === vm.store.id) {
          // Prefer items owned by this character
          value += 0.5;
          // Leave equipped items alone if they need XP, and on the current character
          if (item.equipped) {
            return 1000;
          }
        } else if (item.owner === 'vault') {
          // Prefer items in the vault over items owned by a different character
          // (but not as much as items owned by this character)
          value += 0.05;
        }

        // Prefer locked items (they're stuff you want to use/keep)
        // and apply different rules to them.
        if (item.locked) {
          value += 500;
          value += [
            'Common',
            'Uncommon',
            'Rare',
            'Legendary',
            'Exotic'
          ].indexOf(item.tier) * 10;
        } else {
          // For unlocked, prefer blue items so when you destroy them you get more mats.
          value += [
            'Common',
            'Uncommon',
            'Exotic',
            'Legendary',
            'Rare'
          ].indexOf(item.tier) * 10;
        }

        // Choose the item w/ the highest XP
        value += 10 * (item.talentGrid.totalXP / item.talentGrid.totalXPRequired);

        value += item.primStat ? item.primStat.value / 1000 : 0;

        return value;
      };

      var loadout = optimalLoadout(applicableItems, bestItemFn, 'Item Leveling');
      vm.applyLoadout(loadout, $event);
    };

    // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
    vm.maxLightLoadout = function maxLightLoadout($event) {
      // These types contribute to light level
      var lightTypes = ['Primary',
                        'Special',
                        'Heavy',
                        'Helmet',
                        'Gauntlets',
                        'Chest',
                        'Leg',
                        'ClassItem',
                        'Artifact',
                        'Ghost'];

      var applicableItems = _.select(dimItemService.getItems(), function(i) {
        return i.canBeEquippedBy(vm.store) &&
          i.primStat !== undefined && // has a primary stat (sanity check)
          _.contains(lightTypes, i.type); // one of our selected types
      });

      var bestItemFn = function(item) {
        var value = item.primStat.value;

        // Break ties when items have the same stats. Note that this should only
        // add less than 0.25 total, since in the exotics special case there can be
        // three items in consideration and you don't want to go over 1 total.
        if (item.owner === vm.store.id) {
          // Prefer items owned by this character
          value += 0.1;
          if (item.equipped) {
            // Prefer them even more if they're already equipped
            value += 0.1;
          }
        } else if (item.owner === 'vault') {
          // Prefer items in the vault over items owned by a different character
          // (but not as much as items owned by this character)
          value += 0.05;
        }
        return value;
      };

      var loadout = optimalLoadout(applicableItems, bestItemFn, 'Maximize Light');
      vm.applyLoadout(loadout, $event);
    };

    // A dynamic loadout set up to level weapons and armor
    vm.gatherEngramsLoadout = function gatherEngramsLoadout($event, options = {}) {
      var engrams = _.select(dimItemService.getItems(), function(i) {
        return i.isEngram() && !i.location.inPostmaster && (options.exotics ? true : !i.isExotic);
      });

      if (engrams.length === 0) {
        toaster.pop('warning', 'Gather Engrams', 'No ' + (options.exotics ? '' : 'non-exotic ') + 'engrams are available to transfer.');
        return;
      }

      var itemsByType = _.mapObject(_.groupBy(engrams, 'type'), function(items) {
        // Sort exotic engrams to the end so they don't crowd out other types
        items = _.sortBy(items, function(i) {
          return i.isExotic ? 1 : 0;
        });
        // No more than 9 engrams of a type
        return _.first(items, 9);
      });

      // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
      var finalItems = {};
      _.each(itemsByType, function(items, type) {
        if (items) {
          finalItems[type.toLowerCase()] = items.map(function(i) {
            return angular.copy(i);
          });
        }
      });

      var loadout = {
        classType: -1,
        name: 'Gather Engrams',
        items: finalItems
      };
      vm.applyLoadout(loadout, $event);
    };

    // Move items matching the current search. Max 9 per type.
    vm.searchLoadout = function searchLoadout($event) {
      var items = _.select(dimItemService.getItems(), function(i) {
        return i.visible && !i.location.inPostmaster;
      });

      var itemsByType = _.mapObject(_.groupBy(items, 'type'), function(items) {
        return _.first(items, 9);
      });

      // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
      var finalItems = {};
      _.each(itemsByType, function(items, type) {
        if (items) {
          finalItems[type.toLowerCase()] = items.map(function(i) {
            var copy = angular.copy(i);
            copy.equipped = false;
            return copy;
          });
        }
      });

      var loadout = {
        classType: -1,
        name: 'Filtered Items',
        items: finalItems
      };
      vm.applyLoadout(loadout, $event);
    };

    vm.startFarmingEngrams = function startFarmingEngrams() {
      ngDialog.closeAll();
      dimEngramFarmingService.start(vm.store);
    };

    // Generate an optimized loadout based on a filtered set of items and a value function
    function optimalLoadout(applicableItems, bestItemFn, name) {
      var itemsByType = _.groupBy(applicableItems, 'type');

      var isExotic = function(item) {
        return item.isExotic && !item.hasLifeExotic();
      };

      // Pick the best item
      var items = _.mapObject(itemsByType, function(items) {
        return _.max(items, bestItemFn);
      });

      // Solve for the case where our optimizer decided to equip two exotics
      var exoticGroups = [['Primary', 'Special', 'Heavy'], ['Helmet', 'Gauntlets', 'Chest', 'Leg']];
      _.each(exoticGroups, function(group) {
        var itemsInGroup = _.pick(items, group);
        var numExotics = _.select(_.values(itemsInGroup), isExotic).length;
        if (numExotics > 1) {
          var options = [];

          // Generate an option where we use each exotic
          _.each(itemsInGroup, function(item, type) {
            if (isExotic(item)) {
              var option = angular.copy(itemsInGroup);
              var optionValid = true;
              // Switch the other exotic items to the next best non-exotic
              _.each(_.omit(itemsInGroup, type), function(otherItem, otherType) {
                if (isExotic(otherItem)) {
                  var nonExotics = _.reject(itemsByType[otherType], isExotic);
                  if (_.isEmpty(nonExotics)) {
                    // this option isn't usable because we couldn't swap this exotic for any non-exotic
                    optionValid = false;
                  } else {
                    option[otherType] = _.max(nonExotics, bestItemFn);
                  }
                }
              });

              if (optionValid) {
                options.push(option);
              }
            }
          });

          // Pick the option where the optimizer function adds up to the biggest number, again favoring equipped stuff
          var bestOption = _.max(options, function(opt) { return sum(_.values(opt), bestItemFn); });
          _.assign(items, bestOption);
        }
      });

      // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
      var finalItems = {};
      _.each(items, function(item, type) {
        var itemCopy = angular.copy(item);
        itemCopy.equipped = true;
        finalItems[type.toLowerCase()] = [itemCopy];
      });

      return {
        classType: -1,
        name: name,
        items: finalItems
      };
    }
  }
})();
