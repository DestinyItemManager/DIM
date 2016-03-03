(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimWebWorker', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, dimStoreService, dimItemService, ngDialog, dimWebWorker, dimLoadoutService) {
    var vm = this;

    angular.extend(vm, {
      showBlues: false,
      calculating: false,
      combinations: null,

      loadCombinations: function(e) {
        if (vm.calculating) return; // no work to do

        var worker = new dimWebWorker({
          fn:function(args) {
            var max = MinMaxUtil.getSets(JSON.parse(args.data));
            console.log(max)
            if (!max) {
              this.postMessage('undefined');
            }
            else {
              this.postMessage(JSON.stringify(max));
            }
          },
          include:['scripts/minmax/dimMinMax.util.js']
        });

        vm.calculating = true;
        worker.do(JSON.stringify(vm.allItems))
          .then(function(message) {
            vm.calculating = false;

            if (message === 'undefined') return; // no suitable path found

            vm.combinations = JSON.parse(message);
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

          // all stores
          _.each(stores, function(store, id, list) {
            // all armor in store
            var items = _.filter(store.items, function(item) {
              return item.primStat &&
//                item.primStat.statHash === 3897883278 && // has defence hash
                (item.sort === 'Armor' || item.type === 'Artifact') &&
//                (!vm.sBlues || item.tier === 'Rare')
                item.stats


            });

            allItems = allItems.concat(items);
          });

//          allItems = _.sortBy(allItems, function(item) {
//            return item.primStat.value;
//          });


          vm.allItems = allItems;
          vm.loadCombinations();
        });
      },

      closeDialog: function() {
        $scope.$parent.closeThisDialog();
      }
    });

    vm.getItems();
  }
})();
