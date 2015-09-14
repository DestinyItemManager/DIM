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
        classType: '=dimClass',
        store: '=dimLoadoutPopup'
      },
      replace: true,
      template: [
        '<div class="loadout-popup-content">',
        '  <div class="loadout-list"><div class="loadout-set"><span class="button-create" ng-click="vm.newLoadout($event)">+ Create Loadout</span></div></div>',
        '  <div class="loadout-list">',
        '    <div ng-repeat="loadout in vm.loadouts track by loadout.id" class="loadout-set">',
        '      <span class="button-name" title="{{ loadout.name }}" ng-click="vm.applyLoadout(loadout, $event)">{{ loadout.name }}</span>',
        '      <span class="button-delete" ng-click="vm.deleteLoadout(loadout, $event)"><i class="fa fa-trash-o"></i></span>',
        '      <span class="button-edit" ng-click="vm.editLoadout(loadout, $event)"><i class="fa fa-pencil"></i></span>',
        '    </div>',
        '  </div>',
        '  <div class="loadout-list"><div class="loadout-set">',
        '    <span class="button-name button-random-name" ng-click="vm.equipRandom(vm.randomWeapons, vm.randomArmor, $event)"><i class="fa fa-random"></i> Randomize</span>',
        '    <span title="Randomize Armor" class="button-random-option button-armor" ng-click="vm.randomToggle(1)" ng-class="{ \'button-random-option-active\': vm.randomArmor }"><i class="fa fa-shield"></i></span>',
        '    <span title="Randomize Weapons" class="button-random-option button-weapons" ng-click="vm.randomToggle(0)" ng-class="{ \'button-random-option-active\': vm.randomWeapons }"><i class="fa fa-hand-o-right"></i></span>',
        '  </div></div>',
        '</div>'
      ].join('')
    };
  }

  LoadoutPopupCtrl.$inject = ['$rootScope', 'ngDialog', 'dimLoadoutService', 'dimItemService', 'toaster', '$q', 'dimStoreService'];

  function LoadoutPopupCtrl($rootScope, ngDialog, dimLoadoutService, dimItemService, toaster, $q, dimStoreService) {
    var vm = this;

    vm.classTypeId = -1;

    var chooseClass = {
      'warlock': 0,
      'titan': 1,
      'hunter': 2
    };

    vm.classTypeId = chooseClass[vm.classType] || 0;

    dimLoadoutService.getLoadouts()
      .then(function(loadouts) {
        vm.loadouts = _.sortBy(loadouts, 'name') || [];

        vm.loadouts = _.filter(vm.loadouts, function(item) {
          return ((item.classType === -1) || (item.classType === vm.classTypeId));
        });
      });

    vm.newLoadout = function newLoadout($event) {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-create-new-loadout', {});
    };

    vm.deleteLoadout = function deleteLoadout(loadout, $event) {
      dimLoadoutService.deleteLoadout(loadout);
      $rootScope.$broadcast('dim-delete-loadout', {});

      dimLoadoutService.getLoadouts()
        .then(function(loadouts) {
          vm.loadouts = _.sortBy(loadouts, 'name') || [];

          vm.loadouts = _.filter(vm.loadouts, function(item) {
            return ((item.classType === -1) || (item.classType === vm.classTypeId));
          });
        });
    };

    vm.editLoadout = function editLoadout(loadout, $event) {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-edit-loadout', {
        loadout: loadout
      });
    };

    vm.applyLoadout = function applyLoadout(loadout, $event) {
      ngDialog.closeAll();

      var scope = {
        failed: false
      };

      var items = _.chain(loadout.items)
        .values()
        .flatten()
        .value();

      var _types = _.chain(items)
        .pluck('type')
        .uniq()
        .value();

      var _items = _.chain(vm.store.items)
        .filter(function(item) {
          return _.contains(_types, item.type);
        })
        .filter(function(item) {
          return (!_.some(items, function(i) {
            return ((i.id === item.id) && (i.hash === item.hash));
          }));
        })
        .groupBy(function(item) {
          return item.type;
        })
        .value();

      applyLoadoutItems(items, loadout, _items, scope);
    };
    
    vm.randomWeapons = false;
    vm.randomArmor = false;
    
    vm.randomToggle = function(option) {
      switch(option) {
        case 0:
          vm.randomWeapons = !vm.randomWeapons;
          break;
        case 1:
          vm.randomArmor = !vm.randomArmor;
          break;
      }
    }  
    
    vm.equipRandom = function equipRandom(weapons, armor, $event) {
      var classType, items = [], matchList = [], matchGroups = [], exoticArmorFound = false, exoticWeaponFound = false;
      
      ngDialog.closeAll();

      var scope = {
        failed: false
      };
      
      if (weapons) matchList.push('Class','Primary','Special','Heavy');
      if (armor) matchList.push('Helmet','Gauntlets','Chest','Leg','ClassItem','Armor');
      
      switch(vm.store.class) {
        case "titan":
          classType = 0;
          break;
        case "hunter":
          classType = 1;
          break;
        case "warlock":
          classType = 2;
          break;
      }
      
      var groups = _.groupBy(_.shuffle(_.where(dimItemService.getItems(),{equipment:true})), 'type');
      
      _.each(matchList, function(match) {
        matchGroups.push(groups[match]);
      });
      
      _.each(matchGroups, function(group) {
        var match = angular.copy(_.find(group, function(item) {
          if (item.name === "Default Shader") {
            return false;
          }
          if (item.tier === "Exotic" && ((item.sort === "Armor" && exoticArmorFound) || (item.sort === "Weapon" && exoticWeaponFound))) {
            console.log('ignored second exotic');
            return false;
          }
          if ((item.type === "Class" || item.sort === "Armor") && item.classType !== classType) {
            return false;
          }
          return true;
        }));
        if (match) {
          if (match.tier === "Exotic") {
            if (match.sort === "Armor") exoticArmorFound = true;
            if (match.sort === "Weapon") exoticWeaponFound = true;
          }
          match.equipped = true;
          items.push(match);
        }
      });

      items = _.chain(items)
        .values()
        .flatten()
        .value();

      var _types = _.chain(items)
        .pluck('type')
        .uniq()
        .value();

      var _items = _.chain(vm.store.items)
        .filter(function(item) {
          return _.contains(_types, item.type);
        })
        .filter(function(item) {
          return (!_.some(items, function(i) {
            return ((i.id === item.id) && (i.hash === item.hash));
          }));
        })
        .groupBy(function(item) {
          return item.type;
        })
        .value();
        
      var loadout = new Object();
      if (weapons && armor) {
        loadout.name = 'Randomized Loadout';
      } else if (weapons) {
        loadout.name = 'Randomized Weapon Loadout';
      } else if (armor) {
        loadout.name = 'Randomized Armor Loadout';
      }

      if (weapons || armor) {
        applyLoadoutItems(items, loadout, _items, scope);
      } else {
        toaster.pop('error', 'Randomized Nothing', 'Select Weapons, Armor, or Both before clicking Randomize.');
      }
    }

    function applyLoadoutItems(items, loadout, _items, scope) {
      if (items.length > 0) {
        var pseudoItem = items.splice(0, 1)[0];
        var item = dimItemService.getItem(pseudoItem);

        if (item.type === 'Class') {
          item = _.findWhere(vm.store.items, {
            hash: pseudoItem.hash
          });
        }

        if (item) {
          var size = _.chain(vm.store.items)
            .filter(function(i) {
              return item.type === i.type;
            })
            .size()
            .value();

          var p = $q.when(item);

          var target;

          if (size === 10) {
            if (item.owner !== vm.store.id) {
              var moveItem = _items[item.type].splice(0, 1);
              p = $q.when(dimStoreService.getStores())
                .then(function(stores) {
                  return _.chain(stores)
                    // .filter(function(s) {
                    //   return (s.id !== 'vault');
                    // })
                    .sortBy(function(s) {
                      if (s.id === vm.store.id) {
                        return 0;
                      } else if (s.id === 'vault') {
                        return 2;
                      } else {
                        return 1;
                      }
                    })
                    .value();
                })
                .then(function(sortedStores) {
                  return _.find(sortedStores, function(s) {
                    return _.chain(s.items)
                      .filter(function(i) {
                        return item.type === i.type;
                      })
                      .size()
                      .value() < ((s.id === 'vault') ? 72 : 10);
                  });
                })
                .then(function(t) {
                  if (_.isUndefined(t)) {
                    throw new Error('Collector eh?  All your characters ' + moveItem[0].type.toLowerCase() + ' slots are full and I can\'t move items of characters, yet... Clear a slot on a character and I can complete the loadout.');
                  }
                  target = t;

                  return dimItemService.moveTo(moveItem[0], target);
                });
            }
          }

          var promise = p
            .then(function() {
              return dimItemService.moveTo(item, vm.store, pseudoItem.equipped);
            })
            .catch(function(a) {
              scope.failed = true;
              toaster.pop('error', item.name, a.message);
            })
            .finally(function() {
              applyLoadoutItems(items, loadout, _items, scope);
            });

          $rootScope.loadingTracker.addPromise(promise);
        }
      } else {
        var dimStores;

        $q.when(dimStoreService.getStores())
          .then(function(stores) {
            dimStores = stores;
            return dimStoreService.updateStores();
          })
          .then(function(bungieStores) {
            _.each(dimStores, function(dStore) {
              if (dStore.id !== 'vault') {
                var bStore = _.find(bungieStores, function(bStore) {
                  return dStore.id === bStore.id;
                });

                dStore.level = bStore.base.characterLevel;
                dStore.percentToNextLevel = bStore.base.percentToNextLevel;
                dStore.powerLevel = bStore.base.characterBase.powerLevel;
                dStore.background = bStore.base.backgroundPath;
                dStore.icon = bStore.base.emblemPath;
              }
            })
          })
          .then(function() {
            var value = 'success';
            var message = 'Your loadout has been transfered.';

            if (scope.failed) {
              value = 'warning';
              message = 'Your loadout has been transfered, with errors.'
            }

            toaster.pop(value, loadout.name, message);
          });
      }
    }
  }
})();
