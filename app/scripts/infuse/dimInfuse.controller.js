(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$scope', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimWebWorker', 'dimLoadoutService'];

  function dimInfuseCtrl($scope, dimStoreService, dimItemService, ngDialog, dimWebWorker, dimLoadoutService) {
    var vm = this;

    angular.extend(vm, {
      getAllItems: false,
      showLockedItems: false,
      targets: [],
      infused: 0,
      exotic: false,
      view: [],
      infusable: [],
      calculating: false,
      transferInProgress: false,

      calculate: function() {
        return vm.targets.reduce(function(light, target) {
          return InfuseUtil.infuse(light, target.primStat.value, vm.exotic);
        }, vm.source.primStat.value);
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
          .reject(function(item) {
            return _.any(vm.targets, function(otherItem) { return otherItem.id === item.id; });
          })
          .value();
      },

      toggleItem: function(e, item) {
        e.stopPropagation();

        // Add or remove the item from the infusion chain
        var index = _.indexOf(vm.targets, item);
        if (index > -1) {
          vm.targets.splice(index, 1);
        } else {
          var sortedIndex = _.sortedIndex(vm.targets, item,
                                          function(i) { return i.primStat.value; });
          vm.targets.splice(sortedIndex, 0, item);
        }

        // Value of infused result
        vm.infused = vm.calculate();
        // The difference from start to finish
        vm.difference = vm.infused - vm.source.primStat.value;
        vm.setView();
      },

      maximizeAttack: function(e) {
        e.stopPropagation();

        if (vm.calculating) return; // no work to do

        var worker = new dimWebWorker({
          fn:function(args) {
            var data = JSON.parse(args.data);
            var max = InfuseUtil.maximizeAttack(data.infusable, data.source, data.exotic);

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

            if (message === 'undefined') return; // no suitable path found

            var max = JSON.parse(message);

            vm.infused    = max.light;
            vm.difference = vm.infused - vm.source.primStat.value;
            vm.targets = max.path.map(function(item) {
              return vm.infusable.find(function(otherItem) {
                return otherItem.id === item.id;
              });
            });
            vm.setView();
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
              return (item.primStat && (!item.locked || vm.showLockedItems) && item.type == vm.source.type && item.primStat.value > vm.source.primStat.value);
            });

            allItems = allItems.concat(items);

          });

          allItems = _.sortBy(allItems, function(item) {
            return item.primStat.value;
          });

          vm.setInfusibleItems(allItems);
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
