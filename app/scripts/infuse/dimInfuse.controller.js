(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$scope', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimWebWorker', 'dimLoadoutService'];

  function dimInfuseCtrl($scope, dimStoreService, dimItemService, ngDialog, dimWebWorker, dimLoadoutService) {
    var vm = this;
    var manualPath = {
      light: "Manual",
      path: []
    };

    angular.extend(vm, {
      getAllItems: true,
      showLockedItems: false,
      onlyBlues: false,
      targets: [],
      infused: 0,
      exotic: false,
      view: [],
      infusable: [],
      excluded: [],
      paths: [manualPath],
      calculating: false,
      transferInProgress: false,

      calculate: function() {
        if (vm.targets.length === 0) {
          return 0;
        } else {
          return vm.targets.reduce(function(light, target) {
            return InfuseUtil.infuse(light, target.primStat.value, vm.exotic);
          }, vm.source.primStat.value);
        }
      },

      setSourceItem: function(item) {
        // Set the source and reset the targets
        vm.source = item;
        vm.exotic = vm.source.tier === 'Exotic';
        vm.infused = 0;
        vm.targets = [];
        vm.statType =
          vm.source.primStat.statHash === 3897883278 ? 'Defense' : // armor item
          vm.source.primStat.statHash === 368428387 ?  'Attack' :  // weapon item
                                                       'Unknown'; // new item?
      },

      setInfusibleItems: function(items) {
        vm.infusable = items;
        vm.setView();
      },

      setView: function() {
        // let's remove the used gear and the one that are lower than the infused result
        vm.view = _.chain(vm.infusable)
          .select(function(item) {
            return item.primStat.value > vm.infused;
          })
          .difference(vm.excluded, vm.targets)
          .value();
      },

      toggleItem: function(e, item) {
        e.stopPropagation();

        function setManualPath() {
          vm.selectedPath = vm.paths[0];
          // Value of infused result
          vm.infused = vm.calculate();
          // The difference from start to finish
          vm.difference = vm.infused - vm.source.primStat.value;
          vm.setView();
        }

        var index = _.indexOf(vm.targets, item);

        if (e.shiftKey) {
          // Hold shift to toggle excluding the item from calculations
          var excludedIndex = _.indexOf(vm.excluded, item);
          if (excludedIndex > -1) {
            // Remove from exclusions
            vm.excluded.splice(excludedIndex, 1);
          } else {
            // Add to exclusions, and remove from targets if it's there.
            vm.excluded.push(item);
            if (index > -1) {
              vm.targets.splice(index, 1);
              setManualPath();
            }
          }

          vm.maximizeAttack();
        } else {
          // Add or remove the item from the infusion chain
          if (index > -1) {
            // Remove from targets
            vm.targets.splice(index, 1);
          } else {
            // Check if it's clickable
            if (!_.contains(vm.view, item) || _.contains(vm.excluded, item)) {
              return;
            }

            // Add it to targets
            var sortedIndex = _.sortedIndex(vm.targets, item, function(i) {
              return i.primStat.value + ((item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5);
            });
            vm.targets.splice(sortedIndex, 0, item);
          }

          setManualPath();
        }
      },

      selectInfusionPath: function(reset) {
        if (vm.selectedPath === vm.paths[0]) {
          if (reset) {
            vm.targets = [];
            vm.infused = 0;
            vm.difference = 0;
          }
        } else {
          vm.infused = vm.selectedPath.light;
          vm.difference = vm.infused - vm.source.primStat.value;
          vm.targets = vm.selectedPath.path.map(function(item) {
            return vm.infusable.find(function(otherItem) {
              return otherItem.id === item.id;
            });
          });
        }
        vm.setView();
      },

      inView: function(item) {
        if (_.contains(vm.view, item)) {
          return '';
        } else if (_.contains(vm.targets, item)) {
          return 'infuse-selected';
        } else if (_.contains(vm.excluded, item)) {
          return 'infuse-excluded';
        } else {
          return 'infuse-hidden';
        }
        //return _.contains(vm.view, item) ? '' : 'search-hidden';
      },

      maximizeAttack: function(e) {
        if (vm.calculating) return; // no work to do

        var worker = new dimWebWorker({
          fn:function(args) {
            var data = JSON.parse(args.data);
            var max = InfuseUtil.maximizeAttack(
              _.reject(data.infusable, function(item) {
                return _.any(data.excluded, function(otherItem) {
                  return item.id == otherItem.id;
                });
              }),
              data.source,
              data.exotic);

            if (!max) {
              this.postMessage('undefined');
            }
            else {
              this.postMessage(JSON.stringify(max));
            }
          },
          include:['vendor/underscore/underscore-min.js', 'scripts/infuse/dimInfuse.util.js']
        });

        vm.calculating = true;
        worker.do(JSON.stringify(vm))
          .then(function(message) {
            vm.calculating = false;

            vm.paths = [manualPath];

            if (message === 'undefined') return; // no suitable path found

            vm.paths = vm.paths.concat(JSON.parse(message));
            var reset = (vm.selectedPath !== vm.paths[0]);
            vm.selectedPath = vm.paths[0];
            vm.selectInfusionPath(reset);
          })
          .then(function() {
            // cleanup worker
            worker.destroy();
          });
      },

      // get Items for infusion
      getItems: function() {
        dimStoreService.getStores(false, true).then(function(stores) {

          var allItems = [];

          // If we want ALL our weapons, including vault's one
          if (!vm.getAllItems) {
            stores = _.filter(stores, function(store) {
              return store.id === vm.source.owner;
            });
          }

          // all stores
          _.each(stores, function(store, id, list) {
            // all items in store
            var items = _.filter(store.items, function(item) {
              return item.primStat &&
                (!item.locked || vm.showLockedItems) &&
                item.type == vm.source.type &&
                item.primStat.value > vm.source.primStat.value &&
                (!vm.onlyBlues || item.tier === 'Rare');
            });

            allItems = allItems.concat(items);

          });

          allItems = _.sortBy(allItems, function(item) {
            return item.primStat.value + ((item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5);
          });

          vm.setInfusibleItems(allItems);
          vm.maximizeAttack();
        });
      },

      closeDialog: function() {
        $scope.$parent.closeThisDialog();
      },

      transferItems: function() {
        dimStoreService.getStore(vm.source.owner).then(function(store) {
          var items = {};
          vm.targets.forEach(function(item) {
            var key = item.type.toLowerCase();
            items[key] = items[key] || [];
            if (items[key].length < 8) {
              var itemCopy = angular.copy(item);
              itemCopy.equipped = false;
              items[key].push(itemCopy);
            }
          });
          // Include the source, since we wouldn't want it to get moved out of the way
          items[vm.source.type.toLowerCase()].push(vm.source);

          var loadout = {
            classType: -1,
            name: 'Infusion Materials',
            items: items
          };

          // TODO: when loadouts can take consumables, move them too
          vm.transferInProgress = true;
          dimLoadoutService.applyLoadout(store, loadout).then(function() {
            vm.transferInProgress = false;
          });
        });
      }
    });

    vm.setSourceItem($scope.$parent.ngDialogData);
    vm.getItems();
  }
})();
